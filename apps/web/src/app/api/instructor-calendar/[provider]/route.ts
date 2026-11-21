import type { NextRequest } from "next/server";
import { calendarProvider } from "@/features/instructor/calendar-auth.server";
import { completeCalendarOAuth } from "@/features/instructor/calendar-callback.server";
import { handleLive, LiveError } from "@/features/live/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const provider = calendarProvider.safeParse((await params).provider);
  if (!provider.success) {
    return handleLive(async () => { throw new LiveError(404, "Calendario no encontrado."); });
  }
  return completeCalendarOAuth(request, provider.data);
}
