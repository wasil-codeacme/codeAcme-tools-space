import { describe, expect, it } from 'vitest';
import { ToolId, TOOLS, canUseTool, toolsForRole } from '@/config/tools';
import { Role } from '@/generated/prisma/enums';

describe('tool registry', () => {
  it('gives every role the time tracking tool', () => {
    expect(toolsForRole(Role.MEMBER).map((tool) => tool.id)).toContain(ToolId.TIME_TRACKING);
    expect(canUseTool(Role.ADMIN, ToolId.TIME_TRACKING)).toBe(true);
  });

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
