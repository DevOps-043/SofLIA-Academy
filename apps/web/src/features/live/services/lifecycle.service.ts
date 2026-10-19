import "server-only";
import { endVideoSession } from "../video-sdk.server";
import { z } from "zod";
import type { LiveContext } from "../server";
import { checked, LiveError } from "../errors";
import type { LiveSession } from "../types";
import { canTransition } from "../schemas";
import { zoomRequest } from "../zoom.server";
import { queueEndedRecordings } from '../recordings/events.server';
import { LIVE_SESSION_COLUMNS } from "../columns";
export async function changeSessionStatus(
  context: LiveContext,
  session: LiveSession,
  body: unknown,
) {
  const { status } = z
    .object({ status: z.enum(["ended", "cancelled"]) })
    .strict()
    .parse(body);
  if (session.status === status) return { session };
  if (!canTransition(session.status, status))
    throw new LiveError(409, "La sesión ya cambió de estado");
  const webinar = session.session_type === "webinar";
  const resourceId = webinar ? session.zoom_webinar_id : session.zoom_meeting_id;
  const resource = webinar ? "webinars" : "meetings";
  if (session.video_provider === "zoom-video") await endVideoSession(context, session);
  if (session.video_provider !== "zoom-video" && resourceId && status === "cancelled")
    await zoomRequest(`/${resource}/${resourceId}`, "DELETE");
  if (session.video_provider !== "zoom-video" && resourceId && status === "ended")
    await zoomRequest(`/${resource}/${resourceId}/status`, "PUT", {
      action: "end",
    });
  const updated = checked(
    await context.db
      .from("live_sessions")
      .update({ status })
      .eq("id", session.id)
      .eq("status", session.status)
      .select(LIVE_SESSION_COLUMNS)
      .maybeSingle(),
  );
  if (!updated) throw new LiveError(409, "La sesión ya cambió de estado");
  if(status==='ended')await queueEndedRecordings(context.db,session.id,new Date().toISOString());
  return { session: updated };
}
