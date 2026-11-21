import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { checked, LiveError, type LiveContext } from "@/features/live/server";

export async function ownCourse(context: LiveContext, id: string) {
  const courseId = z.string().uuid().parse(id);
  if (!context.canTeach) throw new LiveError(403, "Necesitas el rol de instructor");

  const db = createAdminClient();
  const course = checked(await db.from("courses")
    .select("id,title,description,slug,approval_status")
    .eq("id", courseId)
    .eq("instructor_id", context.userId)
    .maybeSingle());
  if (!course) throw new LiveError(404, "Curso no encontrado");
  return { db, course };
}

const title = z.string().trim().min(1).max(200);
const description = z.string().trim().max(8000);
const edit = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("course"), title, description }).strict(),
  z.object({ kind: z.literal("module"), id: z.string().uuid(), title, description }).strict(),
  z.object({
    kind: z.literal("lesson"), id: z.string().uuid(), title, description,
    summary: z.string().max(100000),
  }).strict(),
  z.object({ kind: z.literal("material"), id: z.string().uuid(), lessonId: z.string().uuid(), title, description }).strict(),
  z.object({ kind: z.literal("activity"), id: z.string().uuid(), lessonId: z.string().uuid(), title, description }).strict(),
]);

export async function editOwnCourse(context: LiveContext, id: string, body: unknown) {
  const input = edit.parse(body);
  const { db, course } = await ownCourse(context, id);
  const updatedAt = new Date().toISOString();

  if (input.kind === "course") {
    const updated = checked(await db.from("courses")
      .update({ title: input.title, description: input.description, updated_at: updatedAt })
      .eq("id", course.id).eq("instructor_id", context.userId)
      .select("id").maybeSingle());
    if (!updated) throw new LiveError(404, "Curso no encontrado");
    return;
  }

  if (input.kind === "module") {
    const updated = checked(await db.from("course_modules")
      .update({ module_title: input.title, module_description: input.description, updated_at: updatedAt })
      .eq("module_id", input.id).eq("course_id", course.id)
      .select("module_id").maybeSingle());
    if (!updated) throw new LiveError(404, "Módulo no encontrado");
    return;
  }

  const lessonId = input.kind === "lesson" ? input.id : input.lessonId;
  const lesson = checked(await db.from("course_lessons")
    .select("module_id, course_modules!inner(course_id)")
    .eq("lesson_id", lessonId).eq("course_modules.course_id", course.id)
    .maybeSingle());
  if (!lesson) throw new LiveError(404, "Lección no encontrada");
  if (input.kind === "material") {
    const updated = checked(await db.from("lesson_materials")
      .update({ material_title: input.title, material_description: input.description })
      .eq("material_id", input.id).eq("lesson_id", lessonId).select("material_id").maybeSingle());
    if (!updated) throw new LiveError(404, "Material no encontrado");
    return;
  }
  if (input.kind === "activity") {
    const updated = checked(await db.from("lesson_activities")
      .update({ activity_title: input.title, activity_description: input.description })
      .eq("activity_id", input.id).eq("lesson_id", lessonId).select("activity_id").maybeSingle());
    if (!updated) throw new LiveError(404, "Actividad no encontrada");
    return;
  }
  const updated = checked(await db.from("course_lessons").update({
    lesson_title: input.title, lesson_description: input.description,
    summary_content: input.summary, updated_at: updatedAt,
  }).eq("lesson_id", input.id).eq("module_id", lesson.module_id)
    .select("lesson_id").maybeSingle());
  if (!updated) throw new LiveError(404, "Lección no encontrada");
}

export async function ownCourseContent(context: LiveContext, id: string) {
  const { db, course } = await ownCourse(context, id);
  const modules = checked(await db.from("course_modules")
    .select(`
      module_id,module_title,module_description,
      course_lessons(
        lesson_id,lesson_title,lesson_description,summary_content,
        lesson_materials(material_id,material_title,material_description),
        lesson_activities(activity_id,activity_title,activity_description)
      )
    `)
    .eq("course_id", course.id).order("module_order_index")
    .order("lesson_order_index", { referencedTable: "course_lessons" })) ?? [];
  return { course, modules };
}

export async function ownCourseReviews(context: LiveContext, id: string, page: number) {
  const { db, course } = await ownCourse(context, id);
  const result = await db.from("course_reviews")
    .select("review_id,review_title,review_content,rating,created_at", { count: "exact" })
    .eq("course_id", course.id).eq("is_public", true)
    .order("created_at", { ascending: false }).order("review_id")
    .range(page * 25, page * 25 + 24);
  return { course, reviews: checked(result) ?? [], total: result.count ?? 0 };
}

export async function ownCourseLearners(context: LiveContext, id: string, page: number, includeMetrics: boolean) {
  const { db, course } = await ownCourse(context, id);
  const result = await db.from("organization_course_assignments")
    .select("id,user_id,status,completion_percentage,assigned_at,completed_at,users!organization_course_assignments_user_id_fkey(display_name,first_name,last_name)", { count: "exact" })
    .eq("course_id", course.id).eq("organization_id", context.orgId)
    .or("status.is.null,status.neq.cancelled")
    .order("assigned_at", { ascending: false }).order("id")
    .range(page * 25, page * 25 + 24);
  const rows = checked(result) ?? [];
  const metrics = includeMetrics && rows.length
    ? checked(await context.db.rpc("instructor_course_learner_metrics", {
        p_org: context.orgId, p_user: context.userId, p_course: course.id,
        p_learners: rows.map((learner) => learner.user_id),
      })) ?? []
    : [];
  const byUser = new Map(metrics.map((row) => [row.user_id, row]));
  return {
    course, total: result.count ?? 0,
    learners: rows.map((learner) => ({ ...learner, metrics: byUser.get(learner.user_id) })),
  };
}
