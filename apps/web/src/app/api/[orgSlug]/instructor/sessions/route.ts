import { calendarProvider } from "@/features/instructor/calendar-auth.server";
import { inviteToSession, sessionNotification } from "@/features/instructor/session-delivery.server";
import { ownCourse } from "@/features/instructor/course.service";
import { handleLive, json, liveContext } from "@/features/live/server";
import { scheduleSession } from "@/features/live/services/schedule.service";
import { scheduleSchema } from "@/features/live/schemas";

const bodySchema = scheduleSchema.extend({ calendar: calendarProvider.optional() });

export async function POST(request: Request, { params }: { params: Promise<{ orgSlug: string }> }) {
  return handleLive(async () => {
    const { orgSlug } = await params;
    const context = await liveContext(orgSlug);
    const { calendar, ...input } = bodySchema.parse(await request.json());
    await ownCourse(context, input.course_id);
    const result = await scheduleSession(context, input);
    if (!result.session || result.session.status !== "scheduled") return json(result, 201);
    const path = `/${orgSlug}/live/${result.session.id}`;
    const deliveries = [sessionNotification(context, result.session, path)];
    if (calendar) deliveries.push(inviteToSession(context, result.session, calendar, path));
    const [notification, invitation] = await Promise.allSettled(deliveries);
    const issues = [
      notification?.status === "rejected" ? "No se enviaron las notificaciones de SofLIA." : "",
      invitation?.status === "rejected" ? "No se enviaron las invitaciones del calendario." : "",
    ].filter(Boolean);
    return json({ ...result, ...(issues.length ? { deliveryError: issues.join(" ") } : {}) }, 201);
  });
}
