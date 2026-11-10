import "server-only";
import { loadVideoRecording } from "./video.server";
import path from "node:path";
import { tmpdir } from "node:os";
import { unlink } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LiveDatabase } from "../database.types";
import { checked } from "../errors";
import { zoomRequest } from "../zoom.server";
import { z } from "zod";
import {
  recordingDb,
  RECORDING_RUN_COLUMNS,
  RECORDING_FILE_COLUMNS,
  type RecordingFile,
  type RecordingRun,
} from "./database";
import {
  zoomRecordingFileSchema,
  selectRecordingFiles,
  ingestRecordingEvent,
} from "./events.server";
import { downloadRecording } from "./download.server";
import { probeRecording } from "./probe.server";
import { storeRecording } from "./storage.server";
import { RECORDING_HEARTBEAT_MS, RECORDING_JOB_TIMEOUT_MS } from "./config";
import { logger } from "@/lib/utils/logger";

export function recordingUuidPath(uuid: string) {
  const encoded = encodeURIComponent(uuid);
  return uuid.startsWith("/") || uuid.includes("//")
    ? encodeURIComponent(encoded)
    : encoded;
}
export function recordingCoverage(
  files: Pick<RecordingFile, "starts_at" | "ends_at" | "duration_seconds">[],
  start: string | null,
  end: string | null,
  previous: string,
): "complete" | "gaps" | "unknown" {
  if (previous === "gaps") return "gaps";
  if (!start || !end || !files.length) return "unknown";
  const ordered = [...files].sort(
    (a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at),
  );
  let cursor = Date.parse(start);
  if (
    !Number.isFinite(cursor) ||
    !Number.isFinite(Date.parse(end)) ||
    Date.parse(end) <= cursor
  )
    return "unknown";
  for (const file of ordered) {
    const begin = Date.parse(file.starts_at),
      finish = Date.parse(file.ends_at);
    if (
      !Number.isFinite(begin) ||
      !Number.isFinite(finish) ||
      !file.duration_seconds
    )
      return "unknown";
    if (begin < Date.parse(start) - 15000) return "unknown";
    if (finish > Date.parse(end) + 15000) return "unknown";
    if (
      begin - cursor > 15000 ||
      finish - begin - file.duration_seconds * 1000 > 15000
    )
      return "gaps";
    cursor = Math.max(cursor, finish);
  }
  return Date.parse(end) - cursor > 15000 ? "gaps" : "complete";
}
export async function processRecordingJob(
  db: SupabaseClient<LiveDatabase>,
  signal: AbortSignal,
) {
  signal.throwIfAborted();
  const store = recordingDb(db);
  const job = (checked(await store.rpc("live_recording_claim", {})) || [])[0];
  if (!job?.lease_id) return false;
  let run: RecordingRun | null = null;
  const controller = new AbortController();
  const cancel = () => controller.abort(signal.reason);
  signal.addEventListener("abort", cancel, { once: true });
  if (signal.aborted) cancel();
  const deadline = setTimeout(
    () =>
      controller.abort(
        new Error("La transferencia excedió su presupuesto de tiempo."),
      ),
    RECORDING_JOB_TIMEOUT_MS,
  );
  const renew = async () => {
    const renewed = checked(
      await store.rpc("live_recording_renew", {
        p_run: job.run_id,
        p_lease: job.lease_id!,
      }),
    );
    if (!renewed) {
      controller.abort();
      throw new Error("La concesión de transferencia caducó.");
    }
  };
  let renewing = false;
  const timer = setInterval(() => {
    if (renewing) return;
    renewing = true;
    void renew()
      .catch(() => controller.abort())
      .finally(() => {
        renewing = false;
      });
  }, RECORDING_HEARTBEAT_MS);
  try {
    controller.signal.throwIfAborted();
    logger.info("Comenzó la importación de una grabación", {
      runId: job.run_id,
      attempt: job.attempts,
    });
    run = checked(
      await store
        .from("live_recording_runs")
        .select(RECORDING_RUN_COLUMNS)
        .eq("id", job.run_id)
        .single(),
    );
    if (!run) throw new Error("La grabación no existe.");
    await renew();
    checked(
      await store
        .from("live_recording_runs")
        .update({ status: "importing" })
        .eq("id", run.id)
        .in("status", ["processing", "failed", "missing"]),
    );
    const sourceSession = checked(await db.from("live_sessions").select("zoom_meeting_id,zoom_webinar_id,session_type,video_provider").eq("id", run.session_id).single());
    if (!sourceSession) throw new Error("La sesión de grabación no existe.");
    const video = sourceSession.video_provider === "zoom-video";
    const videoMeta = video ? await loadVideoRecording(db, run) : null;
    const meta = videoMeta ?? z
      .object({
        uuid: z.string(),
        host_id: z.string(),
        id: z.union([z.string(), z.number()]),
        start_time: z.string().datetime({ offset: true }).optional(),
        recording_files: z.array(zoomRecordingFileSchema).max(1000),
      })
      .passthrough()
      .parse(
        await zoomRequest(
          `/meetings/${recordingUuidPath(run.provider_uuid)}/recordings`,
        ),
      );
    if (meta.uuid !== run.provider_uuid || meta.host_id !== run.host_id)
      throw new Error("La instancia del proveedor no coincide.");
    if (!video && String(meta.id) !== (sourceSession.session_type === "webinar" ? sourceSession.zoom_webinar_id : sourceSession.zoom_meeting_id))
      throw new Error("La grabación pertenece a otro evento.");
    if (!run.starts_at && meta.start_time)
      checked(
        await store
          .from("live_recording_runs")
          .update({ starts_at: meta.start_time })
          .eq("id", run.id)
          .is("starts_at", null),
      );
    if (!video) await ingestRecordingEvent(db, {
      event: "recording.completed",
      payload: { account_id: run.account_id, object: meta },
    });
    const files =
      checked(
        await store
          .from("live_recording_files")
          .select(RECORDING_FILE_COLUMNS)
          .eq("run_id", run.id)
          .order("starts_at")
          .limit(101),
      ) || [];
    if (!files.length || files.length > 100)
      throw new Error("No hay una edición de vídeo disponible.");
    const remote = selectRecordingFiles(meta.recording_files);
    for (const file of files) {
      if (file.status === "stored") continue;
      const candidate = remote.find((f) => f.id === file.provider_file_id);
      if (
        !candidate?.download_url ||
        candidate.file_size !== file.expected_bytes
      )
        throw new Error("El proveedor no confirmó el archivo.");
      let downloaded = "";
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          downloaded = await downloadRecording(
            candidate.download_url,
            file.id,
            file.expected_bytes,
            path.join(
              process.env.RECORDING_SPOOL_DIRECTORY ||
                path.join(tmpdir(), "soflia-recordings"),
              job.lease_id,
            ),
            controller.signal,
            renew,
            videoMeta ? async () => videoMeta.downloadToken : undefined,
          );
          break;
        } catch (error) {
          if (attempt === 2 || controller.signal.aborted) throw error;
          await renew();
          await sleep(1000 * 2 ** attempt, undefined, {
            signal: controller.signal,
          });
        }
      }
      const media = await probeRecording(downloaded, controller.signal);
      await renew();
      file.duration_seconds = media.duration;
      const session = checked(
        await db
          .from("live_sessions")
          .select("organization_id")
          .eq("id", run.session_id)
          .single(),
      );
      if (!session) throw new Error("Sesión sin acceso.");
      const key = `${session.organization_id}/${run.session_id}/${run.id}/${file.id}/${job.lease_id}.mp4`;
      if (
        !checked(
          await store.rpc("live_recording_stage_asset", {
            p_run: run.id,
            p_lease: job.lease_id,
            p_file: file.id,
            p_key: key,
          }),
        )
      )
        throw new Error("No se pudo reservar espacio privado para el vídeo.");
      await storeRecording(downloaded, key, controller.signal);
      await renew();
      const committed = await store.rpc("live_recording_store_file", {
        p_run: run.id,
        p_lease: job.lease_id,
        p_file: file.id,
        p_key: key,
        p_hash: media.sha256,
        p_bytes: file.expected_bytes,
        p_duration: media.duration,
      });
      if (committed.error || !committed.data) {
        const current = checked(
          await store
            .from("live_recording_files")
            .select("status,object_key")
            .eq("id", file.id)
            .single(),
        );
        if (current?.status !== "stored" || current.object_key !== key)
          throw new Error(
            "La copia requiere reconciliación antes de confirmarse.",
          );
      }
      await unlink(downloaded).catch(() => {});
      await unlink(downloaded + ".etag").catch(() => {});
    }
    const latest = checked(
      await store
        .from("live_recording_runs")
        .select("starts_at,ends_at,coverage")
        .eq("id", run.id)
        .single(),
    );
    let coverage = recordingCoverage(
      files,
      latest?.starts_at || null,
      latest?.ends_at || null,
      latest?.coverage || "unknown",
    );
    if (!video && coverage === "complete" && sourceSession.session_type === "webinar") {
      const editorial = await zoomRequest(
        `/webinars/${encodeURIComponent(sourceSession.zoom_webinar_id!)}`,
      ).catch(() => null);
      if (
        !z
          .object({
            settings: z.object({ practice_session: z.literal(false) }),
          })
          .safeParse(editorial).success
      ) {
        coverage = "unknown";
        logger.warn("La edición requiere revisar el ensayo del webinar", {
          runId: job.run_id,
        });
      }
    }
    if (
      !checked(
        await store.rpc("live_recording_finish", {
          p_run: run.id,
          p_lease: job.lease_id,
          p_coverage: coverage,
        }),
      )
    )
      throw new Error("La grabación fue reclamada por otro worker.");
    logger.info("La grabación quedó archivada", {
      runId: job.run_id,
      coverage,
    });
  } catch {
    logger.warn("La importación requiere recuperación", {
      runId: job.run_id,
      attempt: job.attempts,
      cancelled: controller.signal.aborted,
    });
    const retry = job.attempts < 6 || signal.aborted;
    checked(
      await store.rpc("live_recording_fail", {
        p_run: job.run_id,
        p_lease: job.lease_id,
        p_retry: retry,
        p_shutdown: signal.aborted,
        p_available: new Date(
          Date.now() +
            Math.min(3600000, 30000 * 2 ** job.attempts) +
            Math.random() * 5000,
        ).toISOString(),
      }),
    );
    // El scheduler debe observar el fallo aunque la recuperación esté encolada.
    throw new Error("La importación quedó pendiente de recuperación.");
  } finally {
    clearInterval(timer);
    clearTimeout(deadline);
    controller.abort();
    signal.removeEventListener("abort", cancel);
  }
  return true;
}
