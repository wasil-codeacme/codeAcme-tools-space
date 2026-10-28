'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { clientIpFromHeaders } from '@/lib/client-ip';
import {
  SESSION_COOKIE,
  TIME_ZONE_COOKIE,
  TIME_ZONE_COOKIE_MAX_AGE_SECONDS,
} from '@/lib/constants';
import { logger } from '@/lib/logger';
import { MESSAGES } from '@/lib/messages';
import { ROUTES } from '@/lib/routes';
import { sessionCookieOptions, signSession } from '@/lib/session';
import { isValidTimeZone } from '@/lib/time-tracking/date-key';
import { validationError, writeAction } from '@/server/actions/action';
import { loginRateLimiter } from '@/server/container';
import {
  type AuthenticatedUser,
  authenticate,
  changePassword as changePasswordService,
} from '@/server/services/auth.service';
import { changePasswordSchema, loginSchema } from '@/server/validators/auth.schema';
import type { ActionResponse } from '@/types';

async function writeSessionCookie(user: AuthenticatedUser): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession({ sub: user.id, ver: user.sessionVersion }), {
    ...sessionCookieOptions(),
  });
}

async function writeTimeZoneCookie(timeZone: string | undefined): Promise<void> {
  if (!timeZone || !isValidTimeZone(timeZone)) {
    return;
  }
  const store = await cookies();
  store.set(TIME_ZONE_COOKIE, timeZone, {
    ...sessionCookieOptions(),
    maxAge: TIME_ZONE_COOKIE_MAX_AGE_SECONDS,
  });
}

export async function login(raw: unknown): Promise<ActionResponse<never>> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: validationError(parsed.error) };
  }

  // Throttle per IP: blunts credential stuffing and keeps scrypt from starving the server.
  const ip = clientIpFromHeaders(await headers());
  if (!(await loginRateLimiter.consume(ip))) {
    return { error: MESSAGES.GENERIC.RATE_LIMITED };
  }

  try {
    const user = await authenticate(parsed.data);
    if (!user) {
      return { error: MESSAGES.AUTH.LOGIN_ERROR };
    }
    await writeSessionCookie(user);
    await writeTimeZoneCookie(parsed.data.timeZone);
  } catch (error) {
    logger.error({ err: error }, 'Login failed');
    return { error: MESSAGES.GENERIC.UNEXPECTED };
  }
  redirect(ROUTES.HOME);
}

export async function logout(): Promise<void> {
  const store = await cookies();
  // Clear with the same attributes it was set with, or the browser may keep the original cookie.
  store.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
  redirect(ROUTES.AUTH.LOGIN);
}

export const changePassword = writeAction({
  input: changePasswordSchema,
  fallback: MESSAGES.AUTH.PASSWORD_CHANGE_ERROR,
  logMessage: 'Password change failed',
  run: async (input, actor) => {
    const user = await changePasswordService(actor.id, input);
    // The version bump revoked every session, including this one; re-issue it so the user stays in.
    await writeSessionCookie(user);
    return { changed: true };
  },
});
