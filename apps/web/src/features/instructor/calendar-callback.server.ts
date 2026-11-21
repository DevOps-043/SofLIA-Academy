import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { calendarCookie, calendarState, connectCalendar, type CalendarProvider } from "./calendar-auth.server";
import { isCalendarOAuthState } from "./calendar-oauth-state";
import { handleLive, LiveError, liveContext } from "@/features/live/server";

export function completeCalendarOAuth(request: NextRequest, provider: CalendarProvider) {
  return handleLive(async () => {
    const raw = request.cookies.get(calendarCookie)?.value;
    let data: unknown;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      throw new LiveError(400, "La autorización de calendario expiró. Vuelve a iniciar la conexión.");
    }
    const state = calendarState.safeParse(data);
    const returnedState = request.nextUrl.searchParams.get("state");
    if (!state.success || !isCalendarOAuthState(returnedState)
      || state.data.state !== returnedState || state.data.provider !== provider) {
      throw new LiveError(400, "La autorización de calendario expiró. Vuelve a iniciar la conexión.");
    }
    const context = await liveContext(state.data.orgSlug);
    if (!context.canTeach || context.userId !== state.data.userId) {
      throw new LiveError(403, "No se puede conectar el calendario a esta cuenta.");
    }
    const redirect = new URL(`/${state.data.orgSlug}/instructor/in-live`, request.nextUrl.origin);
    redirect.hash = "programar";
    try {
      const code = request.nextUrl.searchParams.get("code");
      if (!code) throw new LiveError(400, "No se autorizó el calendario.");
      await connectCalendar(context, provider, code, state.data.verifier);
      redirect.searchParams.set("calendar", "connected");
    } catch {
      redirect.searchParams.set("calendar", "error");
    }
    const response = NextResponse.redirect(redirect);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    response.cookies.set(calendarCookie, "", { maxAge: 0, path: "/" });
    return response;
  });
}
