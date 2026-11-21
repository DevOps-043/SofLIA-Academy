import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { GOOGLE_OAUTH_CONFIG, GOOGLE_OAUTH_URLS } from "@/lib/oauth/google";
import { getMicrosoftRedirectUri } from "@/lib/oauth/microsoft";
import { checked, LiveError, type LiveContext } from "@/features/live/server";

export const calendarProvider = z.enum(["google", "microsoft"]);
export type CalendarProvider = z.infer<typeof calendarProvider>;
export const calendarState = z.object({
  state: z.string(), verifier: z.string(), userId: z.string(),
  orgSlug: z.string().regex(/^[a-z0-9-]+$/), provider: calendarProvider,
});
export const calendarCookie = "instructor_calendar_oauth";

const tokenResponse = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1).optional(),
  expires_in: z.coerce.number().positive(),
});
const storedToken = tokenResponse.omit({ expires_in: true }).extend({ expiresAt: z.number() });

function providerConfig(provider: CalendarProvider) {
  const google = provider === "google";
  const tenant = process.env.MICROSOFT_TENANT_ID || "common";
  const microsoft = `https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0`;
  const clientId = google ? process.env.GOOGLE_OAUTH_CLIENT_ID : process.env.MICROSOFT_OAUTH_CLIENT_ID;
  const clientSecret = google ? process.env.GOOGLE_OAUTH_CLIENT_SECRET : process.env.MICROSOFT_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new LiveError(503, "El proveedor de calendario aún no está configurado.");
  return {
    clientId, clientSecret,
    authorize: google ? GOOGLE_OAUTH_URLS.authorize : `${microsoft}/authorize`,
    token: google ? GOOGLE_OAUTH_URLS.token : `${microsoft}/token`,
    redirect: google ? GOOGLE_OAUTH_CONFIG.redirectUri : getMicrosoftRedirectUri(),
    scope: google
      ? "https://www.googleapis.com/auth/calendar.events.owned"
      : "offline_access https://graph.microsoft.com/Calendars.ReadWrite",
  };
}

function calendarKey() {
  const secret = process.env.INSTRUCTOR_CALENDAR_TOKEN_KEY;
  if (!secret || secret.length < 32) throw new LiveError(503, "El almacenamiento de calendarios aún no está configurado.");
  return createHash("sha256").update(secret).digest();
}

export function calendarAuthorization(provider: CalendarProvider, state: string, verifier: string) {
  calendarKey();
  const config = providerConfig(provider);
  const url = new URL(config.authorize);
  const params = new URLSearchParams({
    client_id: config.clientId, redirect_uri: config.redirect, scope: config.scope,
    response_type: "code", state, code_challenge_method: "S256",
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
    ...(provider === "google" ? { access_type: "offline", prompt: "consent" } : {}),
  });
  url.search = params.toString();
  return url;
}

async function exchange(provider: CalendarProvider, body: Record<string, string>) {
  const config = providerConfig(provider);
  const response = await fetch(config.token, {
    method: "POST",
    body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, ...body }),
    cache: "no-store", signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new LiveError(409, "Vuelve a conectar tu calendario para continuar.");
  return tokenResponse.parse(await response.json());
}

function decrypt(token: string, identity: string) {
  const data = Buffer.from(token, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", calendarKey(), data.subarray(0, 12));
  decipher.setAAD(Buffer.from(identity));
  decipher.setAuthTag(data.subarray(12, 28));
  const plain = Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString();
  return storedToken.parse(JSON.parse(plain));
}

async function saveTokens(
  context: LiveContext, provider: CalendarProvider,
  tokens: z.infer<typeof tokenResponse>, previousRefreshToken?: string, previousCiphertext?: string,
) {
  const refreshToken = tokens.refresh_token ?? previousRefreshToken;
  if (!refreshToken) throw new LiveError(409, "El proveedor no concedió acceso continuo al calendario. Vuelve a conectar la cuenta.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", calendarKey(), iv);
  cipher.setAAD(Buffer.from(`${context.userId}:${provider}`));
  const data = JSON.stringify({
    access_token: tokens.access_token, refresh_token: refreshToken,
    expiresAt: Date.now() + tokens.expires_in * 1000,
  });
  const encrypted = Buffer.concat([cipher.update(data, "utf8"), cipher.final()]);
  const encryptedTokens = Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
  const patch = { encrypted_tokens: encryptedTokens, updated_at: new Date().toISOString() };
  if (previousCiphertext) {
    checked(await context.db.from("instructor_calendar_connections").update(patch)
      .eq("user_id", context.userId).eq("provider", provider).eq("encrypted_tokens", previousCiphertext));
  } else {
    checked(await context.db.from("instructor_calendar_connections")
      .upsert({ ...patch, user_id: context.userId, provider }));
  }
}

export async function connectCalendar(context: LiveContext, provider: CalendarProvider, code: string, verifier: string) {
  const { redirect } = providerConfig(provider);
  const tokens = await exchange(provider, {
    grant_type: "authorization_code", code, code_verifier: verifier, redirect_uri: redirect,
  });
  await saveTokens(context, provider, tokens);
}

export async function calendarAccessToken(context: LiveContext, provider: CalendarProvider) {
  const connection = checked(await context.db.from("instructor_calendar_connections")
    .select("encrypted_tokens").eq("user_id", context.userId).eq("provider", provider).maybeSingle());
  if (!connection) throw new LiveError(409, "Conecta tu calendario para enviar invitaciones.");
  const tokens = decrypt(connection.encrypted_tokens, `${context.userId}:${provider}`);
  if (tokens.expiresAt - Date.now() > 60000) return tokens.access_token;
  if (!tokens.refresh_token) throw new LiveError(409, "Vuelve a conectar tu calendario para continuar.");
  const refreshed = await exchange(provider, { grant_type: "refresh_token", refresh_token: tokens.refresh_token });
  await saveTokens(context, provider, refreshed, tokens.refresh_token, connection.encrypted_tokens);
  return refreshed.access_token;
}
