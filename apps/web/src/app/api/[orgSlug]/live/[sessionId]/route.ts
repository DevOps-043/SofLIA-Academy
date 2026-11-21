import { NextRequest } from "next/server";
import {
  handleLive,
  json,
  LiveError,
  liveContext,
  liveSession,
} from "@/features/live/server";
import { buildHubSessionLink } from "@/features/live/hub-link";
import { changeSessionStatus } from "@/features/live/services/lifecycle.service";
import { cancelSessionInvitations } from "@/features/instructor/session-delivery.server";
type Context = { params: Promise<{ orgSlug: string; sessionId: string }> };
export async function GET(request: NextRequest, { params }: Context) {
  return handleLive(async () => {
    const { orgSlug, sessionId } = await params;
    const context = await liveContext(orgSlug);
    const { session, canManage } = await liveSession(context, sessionId);
    if (request.nextUrl.searchParams.get("scope") === "mine" && session.instructor_id !== context.userId) {
      throw new LiveError(404, "Sesión no encontrada");
    }
    return json({
      session, canManage, isInstructor: session.instructor_id === context.userId,
      hub_url: buildHubSessionLink(orgSlug, session.id),
    });
  });
}
export async function PATCH(request: NextRequest, { params }: Context) {
  return handleLive(async () => {
    const { orgSlug, sessionId } = await params;
    const context = await liveContext(orgSlug);
    const { session } = await liveSession(context, sessionId, true);
    const result = await changeSessionStatus(context, session, await request.json());
    if (result.session.status === "cancelled") {
      try {
        await cancelSessionInvitations(context, result.session);
      } catch {
        return json({ ...result, deliveryError: "La sesión se canceló en SofLIA. La invitación del calendario requiere un reintento." });
      }
    }
    return json(result);
  });
}
