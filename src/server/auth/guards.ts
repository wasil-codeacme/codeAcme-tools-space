import 'server-only';
import { redirect } from 'next/navigation';
import { type ToolId, canUseTool } from '@/config/tools';
import { Role } from '@/generated/prisma/enums';
import { ROUTES } from '@/lib/routes';
import { getSessionUser } from '@/server/auth/session-context';
import type { SessionUser } from '@/types/auth';

// Page-level guards. They redirect rather than throw, so a stale tab lands somewhere sensible.

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect(ROUTES.AUTH.LOGIN);
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== Role.ADMIN) {
    redirect(ROUTES.HOME);
  }
  return user;
}

export async function requireToolAccess(toolId: ToolId): Promise<SessionUser> {
  const user = await requireUser();
  if (!canUseTool(user.role, toolId)) {
    redirect(ROUTES.HOME);
  }
  return user;
}
