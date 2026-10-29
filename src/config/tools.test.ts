import { describe, expect, it } from 'vitest';
import { ToolId, TOOLS, canUseTool, toolAccessLevel, toolsForUser } from '@/config/tools';
import { Role, ToolAccessLevel } from '@/generated/prisma/enums';

const ADMIN = { role: Role.ADMIN, toolAccess: {} };
const HOURS_ONLY = {
  role: Role.MEMBER,
  toolAccess: { [ToolId.TIME_TRACKING]: ToolAccessLevel.EDIT },
};
const SECRETS_VIEWER = {
  role: Role.MEMBER,
  toolAccess: { [ToolId.ACCOUNTS]: ToolAccessLevel.VIEW },
};

describe('tool access', () => {
  it('gives admins full access to every tool without any grants', () => {
    for (const tool of TOOLS) {
      expect(toolAccessLevel(ADMIN, tool.id)).toBe(ToolAccessLevel.EDIT);
    }
  });

  it('shows members only the tools they were granted', () => {
    expect(toolsForUser(HOURS_ONLY).map((tool) => tool.id)).toEqual([ToolId.TIME_TRACKING]);
    expect(canUseTool(HOURS_ONLY, ToolId.ACCOUNTS)).toBe(false);
  });

  it('lets view-only members read but not change', () => {
    expect(canUseTool(SECRETS_VIEWER, ToolId.ACCOUNTS)).toBe(true);
    expect(canUseTool(SECRETS_VIEWER, ToolId.ACCOUNTS, ToolAccessLevel.EDIT)).toBe(false);
  });
});

describe('tool registry', () => {
  it('keeps tool ids and routes unique', () => {
    expect(new Set(TOOLS.map((tool) => tool.id)).size).toBe(TOOLS.length);
    expect(new Set(TOOLS.map((tool) => tool.href)).size).toBe(TOOLS.length);
  });

  it("starts every tool's tab navigation at the tool root", () => {
    for (const tool of TOOLS) {
      expect(tool.navigation[0]?.href).toBe(tool.href);
    }
  });
});
