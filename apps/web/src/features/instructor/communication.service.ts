import "server-only";
import { z } from "zod";
import { checked, LiveError, type LiveContext } from "@/features/live/server";
import { ownCourse } from "./course.service";

const messageBody = z.object({
  requestId: z.string().uuid(),
  kind: z.enum(["notification", "message", "feedback"]),
  title: z.string().trim().min(1).max(160),
  message: z.string().trim().min(1).max(4000),
  learnerId: z.string().uuid().optional(),
}).strict();

export async function notifyCourse(context: LiveContext, input: {
  courseId: string; requestId: string; kind: string; title: string; message: string;
  url: string; learnerId?: string;
}) {
  return checked(await context.db.rpc("notify_instructor_course", {
    p_org: context.orgId,
    p_user: context.userId,
    p_course: input.courseId,
    p_request: input.requestId,
    p_kind: input.kind,
    p_title: input.title,
    p_message: input.message,
    p_url: input.url,
    ...(input.learnerId ? { p_learner: input.learnerId } : {}),
  }));
}

export async function sendCourseMessage(context: LiveContext, id: string, body: unknown) {
  const input = messageBody.parse(body);
  if (input.kind === "feedback" && !input.learnerId) {
    throw new LiveError(400, "Selecciona un alumno para la retroalimentación.");
  }
  const { course } = await ownCourse(context, id);
  const recipients = await notifyCourse(context, {
    ...input, courseId: course.id, url: `/courses/${encodeURIComponent(course.slug)}/learn`,
  });
  if (!recipients) throw new LiveError(404, "No hay alumnos activos que puedan recibir este mensaje.");
  return { recipients };
}
