import { BriefcaseBusiness, Clock3, KeyRound, Timer } from 'lucide-react';
import { Role, ToolAccessLevel } from '@/generated/prisma/enums';
import { ROUTES } from '@/lib/routes';
import type { ToolDefinition } from '@/types/tool';

export const ToolId = {
  TIME_TRACKING: 'time-tracking',
  ACCOUNTS: 'accounts',
  WORK_TIMER: 'work-timer',
  PROJECTS: 'projects',
} as const;

export type ToolId = (typeof ToolId)[keyof typeof ToolId];

// The platform's tool registry. Adding a tool starts here: see docs/adding-a-tool.md.
export const TOOLS = [
  {
    id: ToolId.TIME_TRACKING,
    name: 'Time Tracking',
    description:
      'Log hours per client, watch monthly retainer limits and export weekly, bi-weekly or monthly reports.',
    icon: Clock3,
    href: ROUTES.TOOLS.TIME_TRACKING.ROOT,
    roles: [Role.ADMIN, Role.MEMBER],
    navigation: [
      { label: 'Log', href: ROUTES.TOOLS.TIME_TRACKING.ROOT },
      { label: 'Overview', href: ROUTES.TOOLS.TIME_TRACKING.OVERVIEW },
      { label: 'Clients', href: ROUTES.TOOLS.TIME_TRACKING.CLIENTS, adminOnly: true },
      { label: 'Reports', href: ROUTES.TOOLS.TIME_TRACKING.REPORTS, adminOnly: true },
    ],
  },
  {
    id: ToolId.ACCOUNTS,
    name: 'Accounts & Secrets',
    description:
      'What we hold for CodeAcme and each client, and where it lives: links, logins, access levels, optional encrypted passwords and an audit trail.',
    icon: KeyRound,
    href: ROUTES.TOOLS.ACCOUNTS.ROOT,
    roles: [Role.ADMIN, Role.MEMBER],
    navigation: [
      { label: 'Accounts', href: ROUTES.TOOLS.ACCOUNTS.ROOT },
      { label: 'Activity', href: ROUTES.TOOLS.ACCOUNTS.ACTIVITY, adminOnly: true },
    ],
  },
  {
    id: ToolId.WORK_TIMER,
    name: 'Work Timer',
    description:
      'Press start when you begin and stop when you finish. Keeps a history with daily, weekly and monthly totals.',
    icon: Timer,
    href: ROUTES.TOOLS.WORK_TIMER.ROOT,
    roles: [Role.ADMIN, Role.MEMBER],
    navigation: [{ label: 'Timer', href: ROUTES.TOOLS.WORK_TIMER.ROOT }],
  },
  {
    id: ToolId.PROJECTS,
    name: 'Projects & Invoices',
    description:
      'Track one-off projects like an MVP with the hours they took and the hours billed, then invoice them.',
    icon: BriefcaseBusiness,
    href: ROUTES.TOOLS.PROJECTS.ROOT,
    roles: [Role.ADMIN, Role.MEMBER],
    navigation: [
      { label: 'Projects', href: ROUTES.TOOLS.PROJECTS.ROOT },
      { label: 'Invoices', href: ROUTES.TOOLS.PROJECTS.INVOICES, adminOnly: true },
      { label: 'Payment details', href: ROUTES.TOOLS.PROJECTS.PAYMENT_DETAILS, adminOnly: true },
    ],
  },
] as const satisfies readonly ToolDefinition[];

export type ToolAccess = Partial<Record<ToolId, ToolAccessLevel>>;

export interface ToolUser {
  role: Role;
  toolAccess: ToolAccess;
}

export function isToolId(value: string): value is ToolId {
  return (Object.values(ToolId) as string[]).includes(value);
}

// A tool must allow the user's role; admins then get full access, members what they were granted.
export function toolAccessLevel(user: ToolUser, toolId: ToolId): ToolAccessLevel | null {
  const tool = getTool(toolId);
  if (!(tool.roles as readonly Role[]).includes(user.role)) {
    return null;
  }
  if (user.role === Role.ADMIN) {
    return ToolAccessLevel.EDIT;
  }
  return user.toolAccess[toolId] ?? null;
}

export function canUseTool(
  user: ToolUser,
  toolId: ToolId,
  needed: ToolAccessLevel = ToolAccessLevel.VIEW,
): boolean {
  const level = toolAccessLevel(user, toolId);
  return level !== null && (needed === ToolAccessLevel.VIEW || level === ToolAccessLevel.EDIT);
}

export function toolsForUser(user: ToolUser): ToolDefinition[] {
  return TOOLS.filter((tool) => canUseTool(user, tool.id));
}

// Tools an admin can hand out to members on the Team page.
export function grantableTools(): ToolDefinition[] {
  return TOOLS.filter((tool) => (tool.roles as readonly Role[]).includes(Role.MEMBER));
}

export function getTool(toolId: ToolId): ToolDefinition {
  const tool = TOOLS.find((candidate) => candidate.id === toolId);
  if (!tool) {
    throw new Error(`Unknown tool: ${toolId}`);
  }
  return tool;
}
