import "server-only";
import { z } from "zod";
import type { LiveContext } from "../server";
import { checked, LiveError } from "../errors";
import type { LiveCatalog } from "../types";
const catalogQuerySchema = z.object({
  view: z.enum(["instructor", "student"]).default("student"),
  scope: z.literal("mine").optional(),
  instructor: z.string().uuid().optional(),
  page: z.coerce.number().int().min(0).max(100000).default(0),
  coursePage: z.coerce.number().int().min(0).max(100000).default(0),
  instructorPage: z.coerce.number().int().min(0).max(100000).default(0),
  period: z.enum(["all", "upcoming", "past"]).default("all"),
});
export const SESSION_PAGE_SIZE = 20;
export async function listLiveCatalog(
  context: LiveContext,
  parameters: URLSearchParams,
): Promise<LiveCatalog> {
  const query = catalogQuerySchema.parse(Object.fromEntries(parameters));
  const teaching = query.view === "instructor";
  const ownWorkspace = teaching && query.scope === "mine";
  if (teaching && !context.canTeach)
    throw new LiveError(403, "Necesitas el rol de instructor");
  const payload = checked(
    await context.db.rpc("live_catalog", {
      p_org: context.orgId,
      p_user: context.userId,
      p_teaching: teaching,
      ...(ownWorkspace ? { p_instructor: context.userId } : query.instructor && context.isAdmin
        ? { p_instructor: query.instructor }
        : {}),
      p_offset: query.page * SESSION_PAGE_SIZE,
      p_limit: SESSION_PAGE_SIZE,
      p_course_offset: query.coursePage * 50,
      p_instructor_offset: query.instructorPage * 50,
      p_period: query.period,
    }),
  );
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    throw new LiveError(503, "Respuesta de catálogo inválida");
  const catalog = payload as unknown as Omit<
    LiveCatalog,
    "userId" | "isAdmin" | "canTeach"
  >;
  return {
    ...catalog,
    ...(ownWorkspace ? { instructors: [], instructorTotal: 0 } : {}),
    userId: context.userId,
    isAdmin: context.isAdmin,
    canTeach: context.canTeach,
  };
}
