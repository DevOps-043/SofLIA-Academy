import "server-only";
import { isPlatformAdminRole } from "@/lib/auth/platform-role";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LiveDatabase } from "./database.types";
import { LiveError, checked } from "./errors";
import { logger } from "@/lib/utils/logger";
import { incrementCounter } from "@/lib/observability/metrics";
import { z } from "zod";
import { liveValidationMessage } from "./validation-message";
import { LIVE_SESSION_COLUMNS } from "./columns";
export { LiveError, checked, requiredData } from "./errors";

export async function liveContext(orgSlug: string) {
  return liveNavigationContext(orgSlug);
}

/** La navegación y las operaciones usan los mismos permisos académicos. */
export async function liveNavigationContext(orgSlug: string) {
  const { SessionService } = await import("@/features/auth/services/session.service");
  const user = await SessionService.getCurrentUser();
  if (!user) throw new LiveError(401, "Inicia sesión para acceder a la organización");
  const db = createAdminClient();
  const organization = checked(await db.from("organizations").select("id")
    .eq("slug", orgSlug).eq("is_active", true).maybeSingle());
  if (!organization) throw new LiveError(403, "Organización sin acceso");
  return readLiveActorContext(user.id, organization.id);
}

/** Solo invocar después de verificar la identidad en cookie o Supabase Auth. */
export async function liveActorContext(userId: string, organizationId: string) {
  return readLiveActorContext(userId, organizationId);
}

async function readLiveActorContext(userId: string, organizationId: string) {
  const db = createAdminClient() as unknown as SupabaseClient<LiveDatabase>;
  const account = checked(
    await db
      .from("users")
      .select("is_banned,platform_role")
      .eq("id", userId)
      .maybeSingle(),
  );
  if (!account || account.is_banned)
    throw new LiveError(403, "Cuenta sin acceso a In Live");
  const member = checked(
    await db
      .from("organization_users")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle(),
  );
  if (!member) throw new LiveError(403, "Se requiere membresía activa");
  const instructor = checked(
    await db
      .from("organization_instructors")
      .select("organization_id,user_id,zoom_user_id,created_at")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .maybeSingle(),
  );
  const isAdmin = ["owner", "admin"].includes(member.role || "");
  return {
    db,
    userId,
    orgId: organizationId,
    isAdmin,
    ...(isPlatformAdminRole(account.platform_role) ? { platformAdmin: true as const } : {}),
    canTeach: isAdmin || !!instructor,
    instructor,
  };
}
export type LiveContext = Awaited<ReturnType<typeof liveContext>>;
export async function liveSession(
  ctx: LiveContext,
  id: string,
  manage = false,
) {
  z.string().uuid().parse(id);
  const session = checked(
    await ctx.db
      .from("live_sessions")
      .select(LIVE_SESSION_COLUMNS)
      .eq("id", id)
      .eq("organization_id", ctx.orgId)
      .maybeSingle(),
  );
  if (!session) throw new LiveError(404, "Sesión no encontrada");
  const canManage =
    ctx.isAdmin || (ctx.canTeach && session.instructor_id === ctx.userId);
  if (manage && !canManage)
    throw new LiveError(403, "Esta sesión pertenece a otro instructor");
  if (!canManage) {
    const assigned = checked(
      await ctx.db
        .from("organization_course_assignments")
        .select("id")
        .eq("organization_id", ctx.orgId)
        .eq("course_id", session.course_id)
        .eq("user_id", ctx.userId)
        .or("status.is.null,status.neq.cancelled")
        .limit(1),
    );
    if (!assigned?.length)
      throw new LiveError(403, "No tienes asignado este curso");
  }
  return { session, canManage };
}
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
export async function handleLive(work: () => Promise<NextResponse>) {
  try {
    return await work();
  } catch (error) {
    if (error instanceof LiveError) {
      if (error.status >= 500) {
        incrementCounter("live_request_errors_total", { status: error.status });
        logger.error("Live dependency failure", { status: error.status });
      }
      return json({ error: error.message }, error.status);
    }
    if (error instanceof z.ZodError)
      return json({ error: liveValidationMessage(error) }, 400);
    if (error instanceof SyntaxError)
      return json({ error: "Revisa los datos enviados" }, 400);
    incrementCounter("live_request_errors_total");
    logger.error("Live request failed", {
      errorType: error instanceof Error ? error.name : "unknown",
    });
    return json({ error: "No se pudo completar la operación In Live" }, 500);
  }
}
