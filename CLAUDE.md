# CodeAcme Tools

Internal tools platform for CodeAcme LLC. Team members sign in and see a dashboard of tools as cards.
Tools: Time Tracking, Accounts & Secrets, Work Timer. More are added in code (see
`docs/adding-a-tool.md`).

@AGENTS.md

## Standards

The global standards in `~/.claude/CLAUDE.md` and `~/.claude/coding-standards.md` apply in full:
layering (Action → Service → Repository → Prisma), ports and adapters, no magic strings, no
single-letter names, WHY-only comments, conventional commits. This file only lists what is specific to
this project.

## Stack

Next.js 16 (App Router, Cache Components + Partial Prefetching, `src/proxy.ts`), React 19, TypeScript
strict, Tailwind v4, shadcn/ui (radix-nova), Prisma 7 with `@prisma/adapter-pg`, Zod 4, React Hook Form,
sonner, date-fns, pino, `@react-pdf/renderer`, Vitest, Playwright. Package manager: pnpm.

## Commands

```bash
pnpm db:local        # embedded Postgres on :54340 (no Docker); keep it running
pnpm db:migrate      # create/apply a migration in development
pnpm db:seed         # first admin + seeded clients (idempotent)
pnpm dev             # app on http://localhost:3000
pnpm check           # typecheck + lint + format:check + unit/integration tests + build
pnpm test            # Vitest watch (unit + integration on a throwaway embedded Postgres)
pnpm test:e2e        # Playwright against the dev server using the installed Chrome
```

CI runs locally only: run `pnpm check` (and `pnpm test:e2e`) before pushing. There is no hosted CI.

## Project-specific rules

- **Tool registry:** every tool is an entry in `src/config/tools.ts`. The dashboard, sidebar,
  breadcrumbs and tab navigation all read it. Never hardcode a tool elsewhere.
- **Layout by layer, then tool:** `src/server/{actions,services,repositories,validators}/<tool>/`,
  `src/components/tools/<tool>/`, `src/app/(platform)/tools/<tool>/`.
- **Every mutation uses `writeAction`** from `src/server/actions/action.ts`. It authenticates, checks
  `requireAdmin` / `tool`, validates with Zod, maps domain errors (`src/server/errors.ts`) and calls
  `refresh()`. Return values follow `ActionResponse<T>`.
- **Auth:** dependency-free signed session cookie (`src/lib/session.ts`). The proxy only checks the
  signature; `getSessionUser()` re-reads the user on every request (active flag + `sessionVersion`).
  Page guards live in `src/server/auth/guards.ts`. See `docs/adr/0002-session-auth.md`.
- **Client access** is decided only in `src/server/policies/client-access.policy.ts`. Members see
  clients they are assigned to and only their own entries; admins see everything.
- **Cache Components:** anything that reads cookies, search params, the pathname or the clock must
  sit behind `<Suspense>` (pages wrap their content component). Call `connection()` before reading
  the clock in server code. `export const runtime` is not allowed.
- **Dates:** work dates are `yyyy-MM-dd` `DateKey` strings; do date math only through
  `src/lib/time-tracking/date-key.ts` (UTC-safe). "Today" comes from `getTodayKey()` (user time zone
  cookie set at sign-in).
- **Durations** are exact integer minutes. Never round entries.
- **No client-side fetching:** reads happen in Server Components, writes are Server Actions,
  downloads are plain links to route handlers. TanStack Query and the API service chain from the
  standards are intentionally not installed; add them only when a screen genuinely needs client
  fetching.
- **Email** goes through the `Mailer` port (`src/server/ports/mailer.port.ts`), bound in
  `src/server/container.ts`: Resend when `RESEND_API_KEY` is set, otherwise the console adapter logs the
  email. Notification emails run through `runSideEffect` so a mail failure never fails the action.
  Templates live in `src/lib/emails/`. Password reset tokens are stored only as SHA-256 hashes.
- **Secrets:** account passwords and secure notes are encrypted with `src/lib/secret-cipher.ts`
  (`SECRETS_ENCRYPTION_KEY`). Ciphertexts never leave the repository layer; list views only carry
  `hasSecret`. Plaintext is returned only by `revealSecret`, which writes the audit row first.
  Never log secret values (pino redacts `secret` / `secureNotes`).
- **Clients are shared** across tools; access always goes through `client-access.policy.ts`.
- **Prisma 7:** `prisma migrate dev` does not regenerate the client; `pnpm db:migrate` does both.
  Restart `pnpm dev` after a schema change (the dev client is cached on `globalThis`).
- **shadcn files** in `src/components/ui/` are vendored; keep edits minimal and commented.
