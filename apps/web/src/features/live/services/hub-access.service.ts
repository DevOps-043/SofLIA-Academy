import "server-only";
import type { LiveContext } from "../server";
import type { LiveSession } from "../types";
import { LiveError, requiredData } from "../errors";
import { zoomRequest } from "../zoom.server";
import {
  preflightRecordingHost,
  verifyAutomaticRecording,
  requireIdleHost,
} from "../recordings/platform-hosts.server";

export function isZoomAccessUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 8192) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      (!url.port || url.port === "443") &&
      ["zoom.us", "zoom.com"].some(
        (domain) =>
          url.hostname === domain || url.hostname.endsWith(`.${domain}`),
      )
    );
  } catch {
    return false;
  }
}

/** Solo el escritorio autenticado recibe acceso; Learning no renderiza media. */
export async function getHubSessionAccess(
  context: LiveContext,
  session: LiveSession,
  canManage: boolean,
) {
  if (["ended", "cancelled"].includes(session.status))
    throw new LiveError(409, "La sesión ya está cerrada");
  if (session.video_provider === "zoom-video") throw new LiveError(409, "Abre esta aula desde el estudio integrado de Soflia Hub para usar Video SDK.");
  const webinar = session.session_type === "webinar";
  const resourceId = webinar
    ? session.zoom_webinar_id
    : session.zoom_meeting_id;
  if (!resourceId)
    throw new LiveError(409, "La sesión todavía no tiene acceso disponible");
  const host =
    canManage && context.canTeach && session.instructor_id === context.userId;
  const resource = await zoomRequest(
    `/${webinar ? "webinars" : "meetings"}/${encodeURIComponent(resourceId)}`,
  );
  if (host) {
    const credentials = requiredData(
      await context.db
        .from("live_zoom_credentials")
        .select("host_id")
        .eq("session_id", session.id)
        .single(),
    );
    if (resource?.host_id !== credentials.host_id)
      throw new LiveError(
        403,
        "El anfitrión de Zoom no coincide con la vinculación autorizada de esta sesión.",
      );
    await preflightRecordingHost(credentials.host_id, webinar);
    await verifyAutomaticRecording(session, credentials.host_id);
    await requireIdleHost(context, session.id);
  }
  const joinUrl = host ? resource?.start_url : resource?.join_url;
  if (!isZoomAccessUrl(joinUrl))
    throw new LiveError(502, "Zoom no devolvió un acceso válido a la sesión");
  return {
    session: {
      id: session.id,
      title: session.title,
      session_type: webinar ? "webinar" : "meeting",
      starts_at: session.starts_at,
      status: session.status,
    },
    role: host ? "host" : "participant",
    join_url: joinUrl,
  };
}
