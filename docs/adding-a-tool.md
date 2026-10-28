# Adding a tool

Example: an "Hour Calculator" tool with the slug `hour-calculator`.

1. **Register it** in `src/config/tools.ts`: add `HOUR_CALCULATOR: 'hour-calculator'` to `ToolId`, add
   its routes to `ROUTES.TOOLS` in `src/lib/routes.ts`, then add an entry to `TOOLS` (name,
   description, lucide icon, `href`, `roles`, `navigation`). The dashboard card, sidebar link and
   breadcrumbs appear automatically.
2. **Pages:** `src/app/(platform)/tools/hour-calculator/layout.tsx` calls
   `requireToolAccess(ToolId.HOUR_CALCULATOR)` and renders `<ToolTabs toolId=… />` (copy the time
   tracking layout). Each `page.tsx` wraps its async content in `<Suspense>`.
3. **UI:** components in `src/components/tools/hour-calculator/`.
4. **Server code (only if the tool stores data):**
   - Prisma models in `prisma/schema.prisma`, then `pnpm db:migrate`.
   - `src/server/repositories/hour-calculator/*.repository.ts` (the only place that imports Prisma).
   - `src/server/services/hour-calculator/*.service.ts` (business rules; never import another service).
   - `src/server/validators/hour-calculator/*.schema.ts` (Zod; shared with forms).
   - `src/server/actions/hour-calculator/*.actions.ts` using `writeAction({ tool: ToolId.HOUR_CALCULATOR, … })`.
5. **Messages** in `src/lib/messages.ts`; constants in `src/lib/constants.ts`.
6. **External services** (storage, email, …) go behind a port in `src/server/ports/` with an adapter
   in `src/server/adapters/`, wired in `src/server/container.ts`.
7. **Tests:** unit tests next to pure logic, `*.integration.test.ts` for services against the
   embedded Postgres, and a Playwright spec in `e2e/` for the main flow. Run `pnpm check`.

A tool that only computes things in the browser (like a calculator) needs steps 1–3 only.
