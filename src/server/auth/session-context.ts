import 'server-only';
import { cookies } from 'next/headers';
import { connection } from 'next/server';
import { cache } from 'react';
import { SESSION_COOKIE } from '@/lib/constants';
import { verifySession } from '@/lib/session';
import { userRepository } from '@/server/repositories/user.repository';
import type { SessionUser } from '@/types/auth';

// The signed cookie proves who signed in, not that they still may. Every request re-reads the user:
// a deactivated account, or a cookie issued before the last password change, counts as signed out.
// The proxy can only check the signature, so this is the real security boundary.
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  // Session expiry compares against the clock, which Cache Components only allows at request time.
  await connection();
  const store = await cookies();
  const payload = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!payload) {
    return null;
  }
  const user = await userRepository.findById(payload.sub);
  if (!user || !user.isActive || user.sessionVersion !== payload.ver) {
    return null;
  }
  return { id: user.id, name: user.name, email: user.email, role: user.role };
});
