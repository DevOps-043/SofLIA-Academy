import { z } from "zod";
import { calendarProvider } from "@/features/instructor/calendar-auth.server";
import { cancelSessionInvitations, inviteToSession, sessionNotification } from "@/features/instructor/session-delivery.server";
import { handleLive, json, LiveError, liveContext, liveSession } from "@/features/live/server";

const action = z.discriminatedUnion("type", [
  z.object({ type: z.literal("notify") }).strict(),
  z.object({ type: z.literal("invite"), provider: calendarProvider }).strict(),
  z.object({ type: z.literal("cancel-invitation") }).strict(),
]);

export async function POST(request: Request, { params }: { params: Promise<{ orgSlug: string; sessionId: string }> }) {
  return handleLive(async () => {
    const { orgSlug, sessionId } = await params;
    const input = action.parse(await request.json());
    const context = await liveContext(orgSlug);
    const { session } = await liveSession(context, sessionId, true);
    if (session.instructor_id !== context.userId) throw new LiveError(403, "La sesión pertenece a otro instructor.");
    if (input.type === "cancel-invitation" && session.status === "cancelled") {
      await cancelSessionInvitations(context, session);
      return json({ success: true });
    }
    if (input.type === "cancel-invitation" || session.status !== "scheduled" || Date.parse(session.starts_at) <= Date.now()) {
      throw new LiveError(409, "La sesión ya cambió de estado.");
    }
    const path = `/${orgSlug}/live/${sessionId}`;
    if (input.type === "invite") await inviteToSession(context, session, input.provider, path);
    else await sessionNotification(context, session, path);
    return json({ success: true });
  });
}
