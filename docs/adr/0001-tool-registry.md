# ADR 0001: Tools are registered in code

- Status: Accepted
- Date: 2026-10-28

## Context

The platform hosts many small internal tools (time tracking first; an hour calculator and inventory
are likely next). The team adds tools by writing code, not by configuring them at runtime.

## Decision

- A typed, `as const` registry in `src/config/tools.ts` lists every tool: id, name, description,
  icon, root route, allowed roles and its tab navigation.
- The dashboard cards, sidebar, breadcrumbs and tool tabs are all derived from the registry.
- Each tool's layout guards access with `requireToolAccess(ToolId.X)`; its actions pass
  `tool: ToolId.X` to `writeAction`, so the same role rule protects pages and mutations.
- Code is organised by layer first, then tool (`src/server/services/<tool>/…`), which keeps the
  repository-only Prisma boundary enforced by ESLint and still groups each tool's files.

## Consequences

- Adding a tool is a registry entry plus that tool's own folders (`docs/adding-a-tool.md`).
- No database table or admin UI for tools until there is a real need to toggle them at runtime.
