import { z } from "zod";
import { checked, handleLive, json, LiveError, liveContext } from "@/features/live/server";

type Route = { params: Promise<{ orgSlug: string }> };
const draft = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000),
  courses: z.array(z.string().uuid()).min(1).max(50),
}).strict();

export async function GET(request: Request, { params }: Route) {
  return handleLive(async () => {
    const context = await liveContext((await params).orgSlug);
    if (!context.canTeach) throw new LiveError(403, "Necesitas el rol de instructor");
    const page = z.coerce.number().int().min(0).max(100000).parse(new URL(request.url).searchParams.get("page") ?? 0);
    const data = await context.db.from("organization_learning_path_assignments")
      .select("learning_paths!inner(id,title,description,created_by,learning_path_items(position,courses(id,title)))", { count: "exact" })
      .eq("organization_id", context.orgId).eq("learning_paths.created_by", context.userId)
      .eq("status", "active").order("assigned_at", { ascending: false }).order("id")
      .range(page * 20, page * 20 + 19);
    return json({ paths: (checked(data) ?? []).map((row) => row.learning_paths), total: data.count ?? 0 });
  });
}

export async function POST(request: Request, { params }: Route) {
  return handleLive(async () => {
    const context = await liveContext((await params).orgSlug);
    if (!context.canTeach) throw new LiveError(403, "Necesitas el rol de instructor");
    const input = draft.parse(await request.json());
    if (new Set(input.courses).size !== input.courses.length) {
      throw new LiveError(400, "Cada curso solo puede aparecer una vez en la ruta.");
    }
    const result = await context.db.rpc("create_instructor_learning_path", {
      p_org: context.orgId, p_user: context.userId, p_id: input.id,
      p_title: input.title, p_description: input.description, p_courses: input.courses,
    });
    if (result.error?.code === "42501") throw new LiveError(403, "Solo puedes añadir cursos de tu autoría.");
    if (result.error?.code === "23505") throw new LiveError(409, "La solicitud ya se usó para otra ruta.");
    return json({ id: checked(result) }, 201);
  });
}
