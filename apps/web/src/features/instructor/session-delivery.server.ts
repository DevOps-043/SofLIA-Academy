import "server-only";
import { z } from "zod";
import { getBaseUrl } from "@/lib/env";
import { checked, LiveError, requiredData, type LiveContext } from "@/features/live/server";
import type { LiveSession } from "@/features/live/types";
import { calendarAccessToken, calendarProvider, type CalendarProvider } from "./calendar-auth.server";
import { notifyCourse } from "./communication.service";

const googleEvents = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const microsoftEvents = "https://graph.microsoft.com/v1.0/me/events";

export async function inviteToSession(context: LiveContext, session: LiveSession, provider: CalendarProvider, path: string) {
  if (session.instructor_id !== context.userId) throw new LiveError(403, "La sesión pertenece a otro instructor.");
  const existing = checked(await context.db.from("instructor_calendar_events")
    .select("provider,remote_id").eq("session_id", session.id).maybeSingle());
  if (existing) {
    if (existing.provider !== provider) throw new LiveError(409, "La sesión ya tiene invitaciones en otro calendario.");
    if (existing.remote_id) return;
  }

  const [accessToken, emails] = await Promise.all([
    calendarAccessToken(context, provider),
    context.db.rpc("instructor_session_attendee_emails", {
      p_org: context.orgId, p_user: context.userId, p_session: session.id,
    }).then(requiredData),
  ]);
  checked(await context.db.from("instructor_calendar_events")
    .upsert({ session_id: session.id, provider }, { ignoreDuplicates: true }));
  const reservation = requiredData(await context.db.from("instructor_calendar_events")
    .select("provider,remote_id").eq("session_id", session.id).maybeSingle());
  if (reservation.provider !== provider) throw new LiveError(409, "La sesión ya tiene un calendario seleccionado.");
  if (reservation.remote_id) return;

  const start = new Date(session.starts_at);
  const end = new Date(start.getTime() + session.duration_minutes * 60000);
  const description = `Abrir sesión en SofLIA Hub: ${new URL(path, getBaseUrl())}`;
  const googleId = session.id.replaceAll("-", "");
  const google = provider === "google";
  const body = google ? {
    id: googleId, summary: session.title, description,
    start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() },
    attendees: emails.map((email) => ({ email })),
    guestsCanInviteOthers: false, guestsCanSeeOtherGuests: false,
  } : {
    transactionId: session.id, subject: session.title,
    body: { contentType: "text", content: description }, hideAttendees: true,
    start: { dateTime: start.toISOString().slice(0, -1), timeZone: "UTC" },
    end: { dateTime: end.toISOString().slice(0, -1), timeZone: "UTC" },
    attendees: emails.map((address) => ({ type: "required", emailAddress: { address } })),
  };
  const response = await fetch(google ? `${googleEvents}?sendUpdates=all` : microsoftEvents, {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(12000),
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const alreadyExists = google && response.status === 409;
  if (!response.ok && !alreadyExists) throw new LiveError(503, "El calendario no aceptó las invitaciones.");
  const remoteId = alreadyExists ? googleId : z.object({ id: z.string().min(1) }).parse(await response.json()).id;
  checked(await context.db.from("instructor_calendar_events").update({ remote_id: remoteId })
    .eq("session_id", session.id).eq("provider", provider));
  const state = checked(await context.db.from("live_sessions").select("status").eq("id", session.id).maybeSingle());
  if (state?.status === "cancelled") await cancelSessionInvitations(context, session);
}

export async function sessionNotification(context: LiveContext, session: LiveSession, path: string) {
  await notifyCourse(context, {
    courseId: session.course_id, requestId: session.id,
    kind: "session", title: `Nueva sesión: ${session.title}`,
    message: "Consulta la fecha y abre la sesión desde tu agenda de SofLIA.",
    url: path,
  });
}

export async function cancelSessionInvitations(context: LiveContext, session: LiveSession) {
  if (session.instructor_id !== context.userId) return;
  const event = checked(await context.db.from("instructor_calendar_events")
    .select("provider,remote_id").eq("session_id", session.id).maybeSingle());
  if (!event) return;
  if (!event.remote_id) throw new LiveError(409, "La invitación del calendario aún se está confirmando.");
  const provider = calendarProvider.parse(event.provider);
  const token = await calendarAccessToken(context, provider);
  const id = encodeURIComponent(event.remote_id);
  const url = provider === "google"
    ? `${googleEvents}/${id}?sendUpdates=all`
    : `${microsoftEvents}/${id}`;
  const response = await fetch(url, {
    method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok && response.status !== 404 && response.status !== 410) {
    throw new LiveError(503, "No se pudo cancelar la invitación del calendario.");
  }
  checked(await context.db.from("instructor_calendar_events").delete().eq("session_id", session.id));
}
