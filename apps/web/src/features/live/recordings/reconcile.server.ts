import "server-only";
import { reconcileVideoRecordings } from "./video.server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LiveDatabase } from "../database.types";
import { zoomRequest } from "../zoom.server";
import { platformHostIds } from "./platform-hosts.server";
import { checked, LiveError } from "../errors";
import { ingestRecordingEvent, zoomRecordingFileSchema } from "./events.server";
import { recordingDb, RECORDING_CURSOR_COLUMNS } from "./database";
const item = z
  .object({
    id: z.union([z.string(), z.number()]),
    uuid: z.string(),
    host_id: z.string(),
    start_time: z.string(),
    recording_files: z.array(zoomRecordingFileSchema).max(1000),
  })
  .passthrough();
/** Una ventana acotada con paginación; no sondeo de vídeo desde el renderer. */
export async function reconcileRecordings(
  db: SupabaseClient<LiveDatabase>,
  signal?: AbortSignal,
) {
  const store = recordingDb(db);
  let imported = await reconcileVideoRecordings(db, signal);
  if (!process.env.ZOOM_PLATFORM_HOST_IDS?.trim()) return imported;
  for (const host of platformHostIds()) {
    signal?.throwIfAborted();
    const previous = checked(
      await store
        .from("live_recording_cursors")
        .select(RECORDING_CURSOR_COLUMNS)
        .eq("host_id", host)
        .maybeSingle(),
    );
    const normalFrom = new Date(Date.now() - 7 * 86400000)
      .toISOString()
      .slice(0, 10);
    const catchupFrom =
      previous?.to_date && previous.to_date < normalFrom
        ? previous.to_date
        : normalFrom;
    const catchupTo = new Date(
      Math.min(Date.now(), Date.parse(catchupFrom) + 29 * 86400000),
    )
      .toISOString()
      .slice(0, 10);
    const cursor = (checked(
      await store.rpc("live_recording_claim_cursor", {
        p_host: host,
        p_from: catchupFrom,
        p_to: catchupTo,
      }),
    ) || [])[0];
    if (!cursor?.lease_id) continue;
    const to = cursor.to_date,
      from = cursor.from_date;
    let token = cursor?.next_page_token || "";
    const save = async (next: string, complete: boolean) => {
      const row = checked(
        await store
          .from("live_recording_cursors")
          .update({
            next_page_token: next,
            window_complete: complete,
            lease_until: new Date(Date.now() + 300000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("host_id", host)
          .eq("lease_id", cursor.lease_id!)
          .gt("lease_until", new Date().toISOString())
          .select("host_id")
          .maybeSingle(),
      );
      if (!row) throw new Error("La reconciliación cambió de propietario.");
    };
    let lastRenewed = Date.now();
    try {
      for (let page = 0; page < 10; page++) {
        signal?.throwIfAborted();
        let response: unknown;
        try {
          response = await zoomRequest(
            `/users/${encodeURIComponent(host)}/recordings?from=${from}&to=${to}&page_size=100${token ? `&next_page_token=${encodeURIComponent(token)}` : ""}`,
          );
        } catch (error) {
          if (
            token &&
            error instanceof LiveError &&
            error.message === "La paginación de Zoom caducó."
          ) {
            await save("", false);
            break;
          }
          throw error;
        }
        const result = z
          .object({
            meetings: z.array(item).max(300),
            next_page_token: z.string().optional(),
          })
          .parse(response);
        for (const recording of result.meetings) {
          signal?.throwIfAborted();
          if (Date.now() - lastRenewed > 20000) {
            await save(token, false);
            lastRenewed = Date.now();
          }
          const known =
            checked(
              await db
                .from("live_sessions")
                .select("id")
                .eq("zoom_meeting_id", String(recording.id))
                .maybeSingle(),
            ) ||
            checked(
              await db
                .from("live_sessions")
                .select("id")
                .eq("zoom_webinar_id", String(recording.id))
                .maybeSingle(),
            );
          if (!known) continue;
          await ingestRecordingEvent(db, {
            event: "recording.completed",
            payload: {
              account_id: process.env.ZOOM_ACCOUNT_ID,
              object: recording,
            },
          });
          imported++;
        }
        token = result.next_page_token || "";
        await save(token, !token);
        if (!token) break;
      }
    } finally {
      checked(
        await store
          .from("live_recording_cursors")
          .update({ lease_id: null, lease_until: null })
          .eq("host_id", host)
          .eq("lease_id", cursor.lease_id),
      );
    }
  }
  return imported;
}
