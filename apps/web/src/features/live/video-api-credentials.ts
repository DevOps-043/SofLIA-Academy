type Environment = Record<string, string | undefined>;

export const VIDEO_API_KEY = "ZOOM_VIDEO_API_KEY";
export const VIDEO_API_JWT_ISSUER = "ZOOM_VIDEO_API_JWT_ISSUER";
export const VIDEO_API_JWT_SECRET = "ZOOM_VIDEO_API_JWT_SECRET";

export function videoApiCredentialNames(env: Environment) {
  return env[VIDEO_API_JWT_ISSUER] || env[VIDEO_API_JWT_SECRET]
    ? [VIDEO_API_JWT_ISSUER, VIDEO_API_JWT_SECRET]
    : [VIDEO_API_KEY];
}
