import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { calendarAuthorization, calendarCookie, calendarProvider } from "@/features/instructor/calendar-auth.server";
import { buildCalendarOAuthState } from "@/features/instructor/calendar-oauth-state";
import { checked, handleLive, json, LiveError, liveContext } from "@/features/live/server";

type Route = { params: Promise<{ orgSlug: string; provider: string }> };

export async function GET(_request: Request, { params }: Route) {
  return handleLive(async () => {
    const { orgSlug, provider: raw } = await params;
    const provider = calendarProvider.parse(raw);
    const context = await liveContext(orgSlug);
    if (!context.canTeach) throw new LiveError(403, "Necesitas el rol de instructor");
    const state = buildCalendarOAuthState(randomBytes(32).toString("base64url"));
    const verifier = randomBytes(32).toString("base64url");
    const response = NextResponse.redirect(calendarAuthorization(provider, state, verifier));
    response.headers.set("Cache-Control", "no-store");
    response.cookies.set(calendarCookie, JSON.stringify({ state, verifier, orgSlug, provider, userId: context.userId }), {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
      maxAge: 600, path: "/",
    });
    return response;
  });
}

export async function DELETE(_request: Request, { params }: Route) {
  return handleLive(async () => {
    const { orgSlug, provider } = await params;
    const context = await liveContext(orgSlug);
    if (!context.canTeach) throw new LiveError(403, "Necesitas el rol de instructor");
    checked(await context.db.from("instructor_calendar_connections").delete()
      .eq("user_id", context.userId).eq("provider", calendarProvider.parse(provider)));
    return json({ success: true });
  });
}
