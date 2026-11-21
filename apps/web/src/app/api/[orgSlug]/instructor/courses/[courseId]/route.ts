import { z } from "zod";
import { handleLive, json, liveContext } from "@/features/live/server";
import {
  editOwnCourse,
  ownCourseContent,
  ownCourseLearners,
  ownCourseReviews,
} from "@/features/instructor/course.service";

type Route = { params: Promise<{ orgSlug: string; courseId: string }> };
const query = z.object({
  view: z.enum(["content", "statistics", "reviews", "recipients"]).default("content"),
  page: z.coerce.number().int().min(0).max(100000).default(0),
});

export async function GET(request: Request, { params }: Route) {
  return handleLive(async () => {
    const { orgSlug, courseId } = await params;
    const { view, page } = query.parse(Object.fromEntries(new URL(request.url).searchParams));
    const context = await liveContext(orgSlug);
    if (view === "reviews") return json(await ownCourseReviews(context, courseId, page));
    if (view === "statistics" || view === "recipients") return json(await ownCourseLearners(context, courseId, page, view === "statistics"));
    return json(await ownCourseContent(context, courseId));
  });
}

export async function PATCH(request: Request, { params }: Route) {
  return handleLive(async () => {
    const { orgSlug, courseId } = await params;
    await editOwnCourse(await liveContext(orgSlug), courseId, await request.json());
    return json({ success: true });
  });
}
