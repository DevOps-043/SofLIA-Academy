import { checked, handleLive, json, LiveError, liveContext } from "@/features/live/server";

export async function GET(_request: Request, { params }: { params: Promise<{ orgSlug: string }> }) {
  return handleLive(async () => {
    const context = await liveContext((await params).orgSlug);
    if (!context.canTeach) throw new LiveError(403, "Necesitas el rol de instructor");
    const rows = checked(await context.db.from("instructor_calendar_connections")
      .select("provider").eq("user_id", context.userId).order("provider"));
    return json({ connected: rows?.map((row) => row.provider) ?? [] });
  });
}
