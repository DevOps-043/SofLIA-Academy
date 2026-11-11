# MFA TOTP — SofLIA Academy

Multi-factor authentication via Time-based One-Time Passwords (TOTP, RFC 6238) for Admin and Business roles.

New enrollments use `SofLIA Academy` as their issuer. Apply
`supabase/migrations/20261111120000_soflia_academy_branding.sql` to update the
database default. Existing enrollments keep their original issuer and remain valid.

## Threat model

- Mitigates A07 OWASP (Identification & Authentication Failures) for high-privilege accounts.
- Defends against password-only credential compromise (phishing, leaked hashes, reuse).
- Combined with HIBP + lockout already in `auth-policy.md`.

## Architecture

| Layer | File | Responsibility |
|---|---|---|
| RFC 6238 primitive | `apps/web/src/lib/auth/mfa/totp.ts` | Pure `node:crypto` TOTP/HOTP, base32, otpauth URI |
| Cipher | `apps/web/src/lib/auth/mfa/secret-cipher.ts` | AES-256-GCM secret encryption with `MFA_SECRET_KEY` |
| Service | `apps/web/src/lib/auth/mfa/mfa.service.ts` | Provisioning, activation, verification, recovery codes |
| Schema | `supabase/migrations/20260518130000_mfa_totp_factors.sql` | `user_mfa_factors` table with RLS |
| Login challenge | `apps/web/src/features/auth/actions/login/mfa-login-challenge.ts` | Signed 5-minute MFA challenge bound to nonce cookie + request fingerprint |
| REST | `apps/web/src/app/api/auth/mfa/*` | Endpoints |

## Endpoints

| Method | Path | Body | Roles | Behavior |
|---|---|---|---|---|
| GET | `/api/auth/mfa/status` | — | Auth | Returns `{ enabled, factorId, lastUsedAt, recoveryCodesRemaining }` |
| POST | `/api/auth/mfa/setup` | — | Admin, Business | Creates `pending` factor; returns `{ factorId, uri, secret, recoveryCodes }` — secret/uri shown ONLY this time |
| POST | `/api/auth/mfa/activate` | `{ factorId, token }` | Admin, Business | Verifies first TOTP code, transitions to `active` |
| POST | `/api/auth/mfa/verify` | `{ token }` or `{ challengeToken, token }` | Auth or pre-session challenge | Verifies code/recovery code; pre-session challenge creates login session only after MFA passes |
| DELETE | `/api/auth/mfa` | `{ token }` | Admin, Business | Disables MFA after re-auth |
| PUT | `/api/auth/mfa` | `{ token }` | Admin, Business | Regenerates recovery codes after re-auth |

## Configuration

Env vars required:

| Variable | Required | Notes |
|---|---|---|
| `MFA_SECRET_KEY` | yes | ≥ 32 chars random; rotated separately from session secrets. Loss = users must re-enroll |
| `MFA_LOGIN_CHALLENGE_SECRET` | recommended | ≥ 32 chars random for pre-session login challenges. Falls back to `MFA_SECRET_KEY` if unset |

Provisioning UI must:

1. Render `uri` as QR code (client-side, never log `secret`).
2. Display `recoveryCodes` once with copy/download CTA + checkbox "I have stored them".
3. Submit first TOTP code to `/api/auth/mfa/activate`.

Login flow integration:

1. After password validation, if `getMfaStatusForLogin(userId).enabled === true`, return `{ requiresMfa: true, challengeToken }` instead of issuing the session.
2. Challenge is signed, expires after 5 minutes, and is bound to an HttpOnly nonce cookie plus request fingerprint.
3. UI prompts code -> `POST /api/auth/mfa/verify` with `{ challengeToken, token }`.
4. On success, server validates org context, issues the session, clears the challenge cookie and redirects.

## Security properties

- Secret cipher: AES-256-GCM with random 12-byte IV per record.
- Drift window: ± 30 s (one period before/after current).
- Token comparison: constant-time.
- Recovery codes: SHA-256 hashed; one-shot (removed on use).
- Login challenge: no session cookies are issued until TOTP/recovery-code verification succeeds.
- RLS: user can only read/write their own factor rows.
- Service role bypass available for admin revocation endpoint (`/api/admin/security/audit-log` writes a `mfa.factor.revoked` event).

## Tests

- `apps/web/src/lib/auth/mfa/__tests__/totp.test.ts` — base32, generation, verification, drift, URI, provisioning, recovery codes.
- `apps/web/src/features/auth/actions/login/__tests__/mfa-login-challenge.test.ts` — signed challenge, nonce cookie, fingerprint binding and org-context reconstruction.

## Follow-ups (Pasada 4)

- Org admin UI is available at `/{orgSlug}/business-panel/settings/mfa`; platform admins can enroll from `/admin/security`.
- Mandatory MFA enforcement by role remains an operational rollout decision.
- Backup factor (recovery key only, no second TOTP).
- Webauthn / passkeys as secondary factor (5.7 stretch goal).
