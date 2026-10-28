# CodeAcme Tools

Internal tools platform for the CodeAcme team. Sign in, pick a tool from the dashboard. The first tool
is **Time Tracking**:

- **Log:** a week strip and day panel. Quick-add items with Enter (`30m`, `1h 10m`, `1:10`, `1.5h`),
  edit inline, delete with undo, and use the keyboard shortcuts (N, T, ←/→, P).
- **Paste from notes:** paste day notes in the usual style. Day headings set the date, and `??` marks
  an item "needs review".
- **Overview:** the yearly retainer sheet as a page: months × weeks, totals, limit, remaining and status.
- **Clients (admin):** monthly limits, categories, member assignments, archive.
- **Reports (admin):** week, 2-week or month reports, with or without CodeAcme branding, as PDF or CSV.
- **Team (admin):** add members with a temporary password, change roles, reset passwords, deactivate.

Also on the platform:

- **Accounts & Secrets:** every client account with its purpose, link, login, access level and 2FA.
  Passwords and secure notes are encrypted (AES-256-GCM), hidden until someone clicks Reveal or Copy,
  and every reveal is in the admin-only Activity log. "Paste from sheet" imports the existing accounts
  table straight from Google Docs or Sheets. Members only see accounts for their assigned clients;
  "CodeAcme internal" accounts are admin-only.
- **Work Timer:** press Start when you begin, Pause for breaks and Stop when you finish. The timer runs in the
  browser and is saved only when you press Stop. History is grouped by month and
  week with totals for today, this week and this month. Sessions can be corrected afterwards, and a
  session with a client can be added to the Time Tracking log in one click.

## Local setup

Requires Node 22+, pnpm 11 and Google Chrome (for end-to-end tests).

```bash
pnpm install
cp .env.example .env          # then fill in the values (see below)
pnpm db:local                 # terminal 1: embedded Postgres, no Docker
pnpm db:migrate               # apply migrations
pnpm db:seed                  # first admin + The 30k Club + AeneDental
pnpm dev                      # terminal 2: http://localhost:3000
```

Local `.env` example:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:54340/codeacme_tools_dev
AUTH_SECRET=<32+ random characters>
SECRETS_ENCRYPTION_KEY=<openssl rand -base64 32>
NEXT_PUBLIC_APP_URL=http://localhost:3000
SEED_ADMIN_NAME=Your Name
SEED_ADMIN_EMAIL=you@codeacme.com
SEED_ADMIN_PASSWORD=<12+ characters>
```

## Checks (local only)

```bash
pnpm check       # typecheck, lint, format check, unit + integration tests, production build
pnpm test:e2e    # Playwright in the installed Chrome; uses the dev database and seed admin
```

Integration tests start their own throwaway Postgres and apply the real migrations. End-to-end tests
create clients and members with `E2E`, `Visible`, `Hidden` and `member-…@example.test` names in the dev
database.

## Deploying to Vercel

1. Create a Vercel project from the GitHub repo.
2. Add **Neon** from the Vercel Marketplace; it injects `DATABASE_URL` (pooled) and
   `DATABASE_URL_UNPOOLED` (migrations).
3. Add **Upstash Redis** from the Marketplace for login rate limiting (`UPSTASH_REDIS_REST_URL`,
   `UPSTASH_REDIS_REST_TOKEN`). Without it, rate limiting falls back to per-instance memory.
4. Set `AUTH_SECRET` (`openssl rand -base64 48`), `SECRETS_ENCRYPTION_KEY` (`openssl rand -base64 32`)
   and `NEXT_PUBLIC_APP_URL`. Keep a safe copy of the encryption key: without it the stored secrets
   cannot be decrypted, and changing it makes existing secrets unreadable.
5. Set the build command to `pnpm vercel-build` (generates the client, applies migrations, builds).
6. Seed once from your machine against production:
   `DATABASE_URL=<unpooled url> SEED_ADMIN_…=… pnpm db:seed`.

## Docs

- `CLAUDE.md`: project rules (on top of the global coding standards)
- `CONTEXT.md`: glossary
- `docs/adding-a-tool.md`: how to add the next tool
- `docs/adr/`: architecture decisions
