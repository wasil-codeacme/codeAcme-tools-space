import type { ToolAccess } from '@/config/tools';
import type { Role } from '@/generated/prisma/enums';

export interface SessionPayload {
  sub: string;
  // The user's sessionVersion when the cookie was issued; a password change bumps the stored value.
  ver: number;
  iat: number;
  exp: number;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  toolAccess: ToolAccess;
}

export type Actor = Pick<SessionUser, 'id' | 'role'>;
