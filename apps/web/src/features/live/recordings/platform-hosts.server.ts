import "server-only";
import { z } from "zod";
import { configuredZoomHost } from "../zoom-host.server";
import { zoomRequest } from "../zoom.server";
import { LiveError, checked } from "../errors";
import type { LiveContext } from "../server";
import { recordingDb } from "./database";

export function platformHostIds(): string[] {
  const ids = (process.env.ZOOM_PLATFORM_HOST_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (
    !ids.length ||
    ids.length > 20 ||
    ids.some((id) => !/^[-A-Za-z0-9_]{1,200}$/.test(id))
  )
    throw new LiveError(
      503,
      "La organización debe configurar anfitriones de Soflia. El instructor no necesita una cuenta de Zoom.",
    );
  return [...new Set(ids)];
}
export async function preflightRecordingHost(host: string, webinar: boolean) {
  if (process.env.ZOOM_RECORDING_PRIVACY_APPROVED !== "true")
    throw new LiveError(
      503,
      "Soflia debe verificar privacidad y retención de la grabación del proveedor antes de habilitar webinars.",
    );
  return verifyRecordingHost(host, webinar);
}

export async function verifyRecordingHost(host: string, webinar: boolean) {
  const configured = await configuredZoomHost(host);
  if (configured.id !== host)
    throw new LiveError(
      403,
      "Zoom no confirmó el anfitrión central autorizado.",
    );
  const user = z
    .object({
      type: z.number(),
      feature: z.object({ webinar: z.boolean().optional() }).optional(),
    })
    .passthrough()
    .safeParse(configured);
  const settings = z
    .object({
      recording: z.object({ cloud_recording: z.boolean() }),
      feature: z.object({ webinar: z.boolean().optional() }).optional(),
    })
    .passthrough()
    .safeParse(
      await zoomRequest(`/users/${encodeURIComponent(host)}/settings`),
    );
  if (
    !user.success ||
    user.data.type !== 2 ||
    !settings.success ||
    !settings.data.recording.cloud_recording ||
    (webinar &&
      user.data.feature?.webinar !== true &&
      settings.data.feature?.webinar !== true)
  )
    throw new LiveError(
      503,
      "La cuenta de la organización no tiene capacidad de grabación para este evento. No se requiere licencia individual del instructor.",
    );
  return configured;
}
export async function claimPlatformHost(
  ctx: LiveContext,
  request: string,
  start: string,
  minutes: number,
  webinar: boolean,
) {
  const db = recordingDb(ctx.db);
  const hosts = platformHostIds();
  const result = await db.rpc("live_claim_zoom_host", {
    p_request: request,
    p_hosts: hosts,
    p_start: start,
    p_minutes: minutes,
  });
  if (result.error?.message.includes("LIVE_HOST_BUSY"))
    throw new LiveError(
      409,
      "Los anfitriones de Soflia están ocupados en ese horario. Elige otro horario.",
    );
  const host = checked(result);
  if (!host) throw new LiveError(503, "No hay anfitrión disponible.");
  try {
    await preflightRecordingHost(host, webinar);
  } catch (error) {
    checked(
      await db
        .from("live_zoom_host_slots")
        .update({ released: true })
        .eq("request_id", request),
    );
    throw error;
  }
  return host;
}
export async function requireIdleHost(ctx: LiveContext, sessionId: string) {
  if (
    !checked(
      await recordingDb(ctx.db).rpc("live_recording_host_idle", {
        p_session: sessionId,
      }),
    )
  )
    throw new LiveError(
      409,
      "El anfitrión central está atendiendo otra sesión. Espera a que termine.",
    );
}
export async function verifyAutomaticRecording(
  session: {
    session_type?: string;
    zoom_webinar_id?: string | null;
    zoom_meeting_id: string | null;
  },
  expectedHost: string,
) {
  const webinar = session.session_type === "webinar";
  const id = webinar ? session.zoom_webinar_id : session.zoom_meeting_id;
  if (!id)
    throw new LiveError(503, "El evento no tiene proveedor de grabación.");
  const remote = z
    .object({
      host_id: z.string(),
      settings: z.object({
        automatic_recording: z.string(),
        encryption_type: z.string().optional(),
      }),
    })
    .passthrough()
    .safeParse(
      await zoomRequest(
        `/${webinar ? "webinars" : "meetings"}/${encodeURIComponent(id)}`,
      ),
    );
  if (!remote.success)
    throw new LiveError(502, "Zoom no devolvió una configuración verificable.");
  if (remote.data.host_id !== expectedHost)
    throw new LiveError(
      403,
      "El anfitrión remoto no coincide con la sesión de Soflia.",
    );
  if (remote.data.settings.encryption_type === "e2ee")
    throw new LiveError(
      409,
      "El cifrado del evento es incompatible con la grabación cloud.",
    );
  if (remote.data.settings.automatic_recording !== "cloud")
    throw new LiveError(
      503,
      "El evento no está preparado para grabarse automáticamente en Soflia.",
    );
  return remote.data;
}
