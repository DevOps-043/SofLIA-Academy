import "server-only";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LiveDatabase } from "../database.types";
import type { Json } from "@/lib/supabase/types";
import { checked, LiveError } from "../errors";
import { videoCredentials, videoRequest, videoSessionPath } from "../video-sdk.server";
import { zoomRecordingFileSchema, selectRecordingFiles } from "./events.server";
import { recordingDb, RECORDING_CURSOR_COLUMNS, type RecordingRun } from "./database";

export const videoRecordingSchema = z.object({
  session_id: z.string().min(1).max(256), session_name: z.string().min(1).max(200),
  session_key: z.string().uuid(), start_time: z.string().datetime({ offset: true }),
  // Los archivos auxiliares carecen de id y tamaño; solo se importan MP4 compuestos.
  recording_files: z.array(z.unknown()).max(1000),
});
export function parseVideoRecording(value: unknown) {
  const meta = videoRecordingSchema.parse(value);
  const files = meta.recording_files.filter((f): f is Record<string, unknown> => !!f && typeof f === "object" && "file_type" in f && f.file_type === "MP4")
    .map(f => zoomRecordingFileSchema.parse(f));
  return { ...meta, recording_files: files };
}
export async function ingestVideoRecording(db: SupabaseClient<LiveDatabase>, value: unknown) {
  const meta = parseVideoRecording(value);
  const credentials = checked(await db.from("live_video_credentials").select("session_id,session_name,account_id").eq("session_id", meta.session_key).maybeSingle());
  if (!credentials) return false;
  if (credentials.session_name !== meta.session_name || credentials.account_id !== process.env.ZOOM_VIDEO_ACCOUNT_ID)
    throw new LiveError(403, "La grabación Video SDK no corresponde al aula y cuenta autorizadas.");
  const session = checked(await db.from("live_sessions").select("video_provider").eq("id", credentials.session_id).single());
  if (session?.video_provider !== "zoom-video") throw new LiveError(403, "El proveedor de la grabación no coincide con el aula.");
  const files = selectRecordingFiles(meta.recording_files).map(file => ({ provider_file_id: file.id,
    layout: file.recording_type, starts_at: file.recording_start, ends_at: file.recording_end, expected_bytes: file.file_size }));
  checked(await recordingDb(db).rpc("live_recording_ingest", {
    p_session: credentials.session_id, p_account: `video:${credentials.account_id}`, p_host: `video:${credentials.account_id}`,
    p_uuid: meta.session_id, p_event: "recording.completed", p_start: meta.start_time, p_files: files as unknown as Json,
  }));
  return true;
}
export async function loadVideoRecording(db: SupabaseClient<LiveDatabase>, run: RecordingRun) {
  const credentials = await videoCredentials({ db }, run.session_id);
  if (run.account_id !== `video:${credentials.account_id}` || run.host_id !== `video:${credentials.account_id}`)
    throw new LiveError(403, "La cuenta del trabajo Video SDK no coincide.");
  const meta = parseVideoRecording(await videoRequest(`/videosdk/sessions/${videoSessionPath(run.provider_uuid, true)}/recordings`));
  if (meta.session_id !== run.provider_uuid || meta.session_key !== run.session_id || meta.session_name !== credentials.session_name)
    throw new LiveError(403, "La instancia Video SDK pertenece a otra aula.");
  await ingestVideoRecording(db, meta);
  return { uuid: meta.session_id, id: meta.session_key, host_id: run.host_id,
    start_time: meta.start_time, recording_files: meta.recording_files };
}

/** Cursor por cuenta, ventanas de hasta 29 días y diez páginas por ejecución. */
export async function reconcileVideoRecordings(db: SupabaseClient<LiveDatabase>, signal?: AbortSignal) {
  const account = process.env.ZOOM_VIDEO_ACCOUNT_ID;
  if (!account || !process.env.ZOOM_VIDEO_API_KEY) return 0;
  const store = recordingDb(db), host = `video:${account}`;
  const previous = checked(await store.from("live_recording_cursors").select(RECORDING_CURSOR_COLUMNS).eq("host_id", host).maybeSingle());
  const recent = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const from = previous?.to_date && previous.to_date < recent ? previous.to_date : recent;
  const to = new Date(Math.min(Date.now(), Date.parse(from) + 29 * 86400000)).toISOString().slice(0, 10);
  const cursor = (checked(await store.rpc("live_recording_claim_cursor", { p_host: host, p_from: from, p_to: to })) || [])[0];
  if (!cursor?.lease_id) return 0;
  let token = cursor.next_page_token || "", imported = 0;
  const save = async (next: string, complete: boolean) => {
    const row = checked(await store.from("live_recording_cursors").update({ next_page_token: next, window_complete: complete,
      lease_until: new Date(Date.now() + 300000).toISOString(), updated_at: new Date().toISOString() })
      .eq("host_id", host).eq("lease_id", cursor.lease_id!).gt("lease_until", new Date().toISOString()).select("host_id").maybeSingle());
    if (!row) throw new LiveError(409, "La reconciliación Video SDK cambió de propietario.");
  };
  try {
    for (let page = 0; page < 10; page++) {
      signal?.throwIfAborted();
      await save(token, false);
      let response: unknown;
      try { response = await videoRequest(`/videosdk/recordings?from=${cursor.from_date}&to=${cursor.to_date}&page_size=100${token ? `&next_page_token=${encodeURIComponent(token)}` : ""}`); }
      catch (error) {
        if (token && error instanceof LiveError && error.message === "La paginación de Video SDK caducó.") await save("", false);
        throw error;
      }
      const result = z.object({ sessions: z.array(z.unknown()).max(300), next_page_token: z.string().max(4096).optional() }).parse(response);
      for (const item of result.sessions) {
        signal?.throwIfAborted();
        // Ignorar otras aplicaciones de la cuenta sin aceptar metadatos parciales del aula.
        const key = z.object({ session_key: z.string().optional() }).parse(item).session_key;
        if (!key || !z.string().uuid().safeParse(key).success) continue;
        await save(token, false);
        if (await ingestVideoRecording(db, item)) imported++;
      }
      token = result.next_page_token || "";
      await save(token, !token);
      if (!token) break;
    }
  } finally {
    checked(await store.from("live_recording_cursors").update({ lease_id: null, lease_until: null }).eq("host_id", host).eq("lease_id", cursor.lease_id));
  }
  return imported;
}
