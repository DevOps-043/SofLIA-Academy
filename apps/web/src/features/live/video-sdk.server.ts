import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { z } from "zod";
import { checked, LiveError } from "./errors";
import type { LiveContext } from "./server";
import type { LiveSession } from "./types";
import type { StudioActor } from "./live-studio-domain";
import { zoomJoinSchema } from "./live-studio.contract";
import { logger } from "@/lib/utils/logger";

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new LiveError(503, `Configura ${key} en Learning para habilitar Video SDK.`);
  return value;
}
export function videoProviderForNewSession() {
  const provider = process.env.LIVE_VIDEO_PROVIDER || "zoom-meeting";
  if (provider !== "zoom-meeting" && provider !== "zoom-video")
    throw new LiveError(503, "El proveedor audiovisual configurado no es válido.");
  return provider;
}
export function videoConfiguration() {
  const key = required("ZOOM_VIDEO_SDK_KEY"), secret = required("ZOOM_VIDEO_SDK_SECRET");
  const account = required("ZOOM_VIDEO_ACCOUNT_ID");
  required("ZOOM_VIDEO_API_KEY");
  if (process.env.ZOOM_VIDEO_RECORDING_PRIVACY_APPROVED !== "true")
    throw new LiveError(503, "Verifica privacidad, retención y grabación cloud de la cuenta Video SDK antes de activarla.");
  return { key, secret, account };
}
export function videoSessionPath(id: string, recording = false) {
  const encoded = encodeURIComponent(id);
  return (recording ? id.includes("/") : id.startsWith("+") || id.startsWith("/") || id.includes("//")) ? encodeURIComponent(encoded) : encoded;
}
export async function videoRequest(path: string, method = "GET", body?: unknown): Promise<unknown> {
  if (!path.startsWith("/videosdk/")) throw new LiveError(500, "Ruta Video SDK inválida.");
  const response = await fetch(`https://api.zoom.us/v2${path}`, {
    method,
    headers: { "x-api-key": required("ZOOM_VIDEO_API_KEY"), "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store", signal: AbortSignal.timeout(20000), redirect: "error",
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    logger.warn("Zoom Video SDK rechazó una petición.", {
      status: response.status,
      code: Number.isSafeInteger(detail?.code) ? detail.code : undefined,
    });
    if (detail?.code === 300 && path.includes("next_page_token="))
      throw new LiveError(502, "La paginación de Video SDK caducó.");
    throw new LiveError(response.status === 429 ? 503 : 502,
      response.status === 429 ? "Video SDK alcanzó su límite de solicitudes. Reintenta más tarde." : "Video SDK rechazó la operación. Revisa credenciales, permisos y grabación cloud de la cuenta.");
  }
  return response.status === 204 ? null : response.json();
}
export function signVideoSdk(sessionName: string, sessionKey: string, actor: Pick<StudioActor, "id" | "canManage">, key: string, secret: string, time = Date.now()) {
  const iat = Math.floor(time / 1000) - 30;
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ app_key: key, role_type: actor.canManage ? 1 : 0,
    tpc: sessionName, session_key: sessionKey, user_key: actor.id, version: 1,
    iat, exp: iat + 13 * 3600, cloud_recording_option: 0, cloud_recording_election: 0,
  })).toString("base64url");
  const body = `${header}.${payload}`;
  return `${body}.${createHmac("sha256", secret).update(body).digest("base64url")}`;
}
export const videoCredentialsSchema = z.object({ session_id: z.string().uuid(), session_name: z.string().min(1).max(200),
  remote_id: z.string().min(1).max(256), password: z.string().min(1).max(10), account_id: z.string().min(1).max(200) });
export async function videoCredentials(context: Pick<LiveContext, "db">, id: string) {
  return videoCredentialsSchema.parse(checked(await context.db.from("live_video_credentials").select("session_id,session_name,remote_id,password,account_id").eq("session_id", id).single()));
}
export async function createVideoStudioJoin(context: LiveContext, session: LiveSession, actor: StudioActor) {
  const config = videoConfiguration();
  const credentials = await videoCredentials(context, session.id);
  if (credentials.account_id !== config.account) throw new LiveError(503, "La cuenta Video SDK no coincide con la del aula.");
  return zoomJoinSchema.parse({ provider: "zoom-video", sessionName: credentials.session_name,
    token: signVideoSdk(credentials.session_name, session.id, actor, config.key, config.secret),
    userName: actor.name, password: credentials.password, recording_required: true,
  });
}
export async function prepareVideoSession(requestId: string) {
  const config = videoConfiguration();
  const name = `soflia_${requestId}`, password = randomBytes(8).toString("base64url").slice(0, 10);
  const remote = z.object({ session_id: z.string().min(1).max(256), session_name: z.literal(name),
    settings: z.object({ auto_recording: z.literal("cloud") }) }).parse(await videoRequest("/videosdk/sessions", "POST", {
      session_name: name, session_password: password, settings: { auto_recording: "cloud" },
    }));
  return { remoteId: remote.session_id, name, password, account: config.account };
}
/** Los IDs de instancia cambian si todos salen; se termina cada instancia viva del aula. */
export async function endVideoSession(context: LiveContext, session: LiveSession) {
  const credentials = await videoCredentials(context, session.id);
  if (credentials.account_id !== videoConfiguration().account) throw new LiveError(503, "La cuenta Video SDK del aula cambió.");
  let token = "";
  for (let page = 0; page < 20; page++) {
    const result = z.object({ sessions: z.array(z.object({ id: z.string(), session_name: z.string(), session_key: z.string().optional() })).max(300),
      next_page_token: z.string().max(4096).optional() }).parse(await videoRequest(`/videosdk/sessions?type=live&page_size=100${token ? `&next_page_token=${encodeURIComponent(token)}` : ""}`));
    for (const item of result.sessions) {
      if (item.session_name !== credentials.session_name || item.session_key !== session.id) continue;
      await videoRequest(`/videosdk/sessions/${videoSessionPath(item.id)}/status`, "PUT", { action: "end" });
    }
    token = result.next_page_token || "";
    if (!token) {
      // Zoom no permite borrar configuraciones que ya iniciaron; el cierre local
      // revoca nuevas emisiones y conserva la referencia para grabaciones.
      return;
    }
  }
  throw new LiveError(503, "No se pudo verificar el cierre de todas las instancias del aula.");
}
