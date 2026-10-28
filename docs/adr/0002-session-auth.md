# ADR 0002: Dependency-free session auth with email and password

- Status: Accepted
- Date: 2026-10-28

## Context

Only the CodeAcme team signs in. An admin creates accounts and hands over a temporary password; there
is no public sign-up and no OAuth requirement. The same approach is already proven in the AdmitFirst
platform.

## Decision

- Passwords are hashed with scrypt (`node:crypto`, random salt, timing-safe compare).
- The session is an HMAC-SHA256 signed cookie (Web Crypto) holding only the user id, the user's
  `sessionVersion` and timestamps. It is `HttpOnly`, `SameSite=Lax` and `Secure` in production, and
  expires after 14 days.
- `src/proxy.ts` only verifies the signature to redirect signed-out visitors. The real boundary is
  `getSessionUser()`, which re-reads the user per request and rejects inactive users or a stale
  `sessionVersion`. Password changes, admin resets and deactivation bump the version, revoking every
  open session immediately.
- Logins are rate limited per IP through a `RateLimiter` port: Upstash in production, an in-memory
  adapter locally.

## Consequences

- No auth library to upgrade; the code is small and fully tested.
- No "forgot password" email flow yet: an admin sets a temporary password. Adding an email port
  (e.g. Resend) later enables self-service resets and invites.
