import { sendCourseMessage } from "@/features/instructor/communication.service";
import { handleLive, json, liveContext } from "@/features/live/server";

export async function POST(request: Request, { params }: { params: Promise<{ orgSlug: string; courseId: string }> }) {
  return handleLive(async () => {
    const { orgSlug, courseId } = await params;
    return json(await sendCourseMessage(await liveContext(orgSlug), courseId, await request.json()), 201);
  });
}
