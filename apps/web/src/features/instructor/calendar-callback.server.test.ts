// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { calendarCookie } from "./calendar-auth.server";
import { completeCalendarOAuth } from "./calendar-callback.server";
import { buildCalendarOAuthState } from "./calendar-oauth-state";

const mocks = vi.hoisted(() => ({
  liveContext: vi.fn(),
  connectCalendar: vi.fn(),
}));

vi.mock("@/features/live/server", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/features/live/server")>(),
  liveContext: mocks.liveContext,
}));

vi.mock("./calendar-auth.server", async (importOriginal) => ({
  ...await importOriginal<typeof import("./calendar-auth.server")>(),
  connectCalendar: mocks.connectCalendar,
}));

const context = { canTeach: true, userId: "teacher" };
const state = buildCalendarOAuthState("nonce");
type Provider = "google" | "microsoft";

function request(provider: Provider, returnedState = state) {
  const path = provider === "google" ? "/api/auth/callback/google" : "/auth/oauth/microsoft/callback";
  const url = new URL(path, "http://localhost:3000");
  url.search = new URLSearchParams({ code: "test-code", state: returnedState }).toString();
  const cookie = encodeURIComponent(JSON.stringify({
    state, verifier: "proof", userId: context.userId, orgSlug: "demo", provider,
  }));
  return new NextRequest(url, { headers: { cookie: `${calendarCookie}=${cookie}` } });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.liveContext.mockResolvedValue(context);
  mocks.connectCalendar.mockResolvedValue(undefined);
});

describe("Retorno OAuth del calendario del instructor", () => {
  it.each(["google", "microsoft"] as const)("conecta %s con la sesión y el código correctos", async (provider) => {
    const response = await completeCalendarOAuth(request(provider), provider);

    expect(response.headers.get("location")).toBe("http://localhost:3000/demo/instructor/in-live?calendar=connected#programar");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.cookies.get(calendarCookie)?.value).toBe("");
    expect(mocks.connectCalendar).toHaveBeenCalledWith(context, provider, "test-code", "proof");
  });

  it("rechaza un estado ajeno o un proveedor distinto antes de canjear el código", async () => {
    expect((await completeCalendarOAuth(request("google", "another-state"), "google")).status).toBe(400);
    expect((await completeCalendarOAuth(request("google"), "microsoft")).status).toBe(400);
    expect(mocks.connectCalendar).not.toHaveBeenCalled();
  });

  it("rechaza la devolución OAuth cuando cambió la cuenta de SofLIA", async () => {
    mocks.liveContext.mockResolvedValue({ ...context, userId: "other" });
    expect((await completeCalendarOAuth(request("google"), "google")).status).toBe(403);
    expect(mocks.connectCalendar).not.toHaveBeenCalled();
  });
});
