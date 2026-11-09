import "server-only";
import { createHmac } from "node:crypto";
import { z } from "zod";
import { checked, LiveError, type LiveContext } from "./server";
import type { LiveSession } from "./types";
import type { StudioActor } from "./live-studio-domain";
import { zoomRequest } from "./zoom.server";
import { STUDIO_RECORDING_NOTICE_REQUIRED, STUDIO_RECORDING_NOTICE_VERSION, zoomJoinSchema } from "./live-studio.contract";
import {
  verifyRecordingHost,
  verifyAutomaticRecording,
  requireIdleHost,
} from "./recordings/platform-hosts.server";

export function signMeetingSdk(
  meetingNumber: string,
  host: boolean,
  clientId: string,
  clientSecret: string,
  time = Date.now(),
) {
  const iat = Math.floor(time / 1000) - 30;
  const exp = iat + 1800;
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      appKey: clientId,
      sdkKey: clientId,
      mn: meetingNumber,
      role: host ? 1 : 0,
      iat,
      exp,
      tokenExp: exp,
    }),
  ).toString("base64url");
  const body = `${header}.${payload}`;
  return `${body}.${createHmac("sha256", clientSecret).update(body).digest("base64url")}`;
}

export async function createZoomStudioJoin(
  context: LiveContext,
  session: LiveSession,
  actor: StudioActor,
  recordingNoticeVersion?: number,
) {
  if (["ended", "cancelled"].includes(session.status))
    throw new LiveError(409, "La sesión está cerrada");
  if (actor.canManage && recordingNoticeVersion !== STUDIO_RECORDING_NOTICE_VERSION)
    throw new LiveError(428, STUDIO_RECORDING_NOTICE_REQUIRED);
  const clientId = process.env.ZOOM_MEETING_SDK_CLIENT_ID;
  const clientSecret = process.env.ZOOM_MEETING_SDK_CLIENT_SECRET;
  if (!clientId || !clientSecret)
    throw new LiveError(503, "Falta configurar Meeting SDK en Learning");
  const meetingNumber =
    session.session_type === "webinar"
      ? session.zoom_webinar_id
      : session.zoom_meeting_id;
  if (!meetingNumber || !/^\d{9,11}$/.test(meetingNumber))
    throw new LiveError(409, "Esta sesión aún no tiene reunión Zoom");
  const credentials = checked(
    await context.db
      .from("live_zoom_credentials")
      .select("host_id,password")
      .eq("session_id", session.id)
      .single(),
  );
  if (!credentials)
    throw new LiveError(503, "La reunión no tiene credenciales disponibles");
  let zak: string | undefined;
  let userEmail:string|undefined;
  if (actor.canManage) {
    const host=await verifyRecordingHost(
      credentials.host_id,
      session.session_type === "webinar",
    );
    await verifyAutomaticRecording(session, credentials.host_id);
    await requireIdleHost(context, session.id);
    if(session.session_type==="webinar"){
      const email=z.string().email().max(254).safeParse(host.email);
      if(!email.success)throw new LiveError(503,"La cuenta central no tiene correo verificado para el webinar.");
      userEmail=email.data;
    }
    const token = z
      .object({ token: z.string().min(1).max(8192) })
      .safeParse(
        await zoomRequest(
          `/users/${encodeURIComponent(credentials.host_id)}/token?type=zak`,
        ),
      );
    if (!token.success)
      throw new LiveError(
        503,
        "Zoom no autorizó al anfitrión; revisa el permiso ZAK",
      );
    zak = token.data.token;
  }else if(session.session_type==="webinar"){
    const profile=checked(await context.db.from("users").select("email").eq("id",context.userId).maybeSingle());
    const email=z.string().email().max(254).safeParse(profile?.email);
    if(!email.success)throw new LiveError(409,"Completa tu correo en Soflia para ingresar al webinar.");
    userEmail=email.data;
  }
  return zoomJoinSchema.parse({
    recording_recovery_allowed:
      process.env.ZOOM_RECORDING_SDK_RECOVERY_VERIFIED === "true",
    meetingNumber,
    signature: signMeetingSdk(
      meetingNumber,
      actor.canManage,
      clientId,
      clientSecret,
    ),
    userName: actor.name,
    password: credentials.password,
    ...(userEmail?{userEmail}:{}),
    ...(zak ? { zak } : {}),
  });
}
