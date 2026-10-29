import 'server-only';
import { randomBytes } from 'node:crypto';
import { passwordChangedEmail } from '@/lib/emails/account-emails';
import { logger } from '@/lib/logger';
import { hashPassword, verifyPassword } from '@/lib/password';
import { InvalidCurrentPasswordError, NotFoundError } from '@/server/errors';
import type { Mailer } from '@/server/ports/mailer.port';
import { userRepository } from '@/server/repositories/user.repository';
import { runSideEffect } from '@/server/side-effect';
import type { ChangePasswordInput, LoginInput } from '@/server/validators/auth.schema';

const DUMMY_SECRET_BYTES = 16;

// Verified against when the email is unknown, so response time does not reveal which emails exist.
let dummyHashPromise: Promise<string> | null = null;
function timingDummyHash(): Promise<string> {
  dummyHashPromise ??= hashPassword(randomBytes(DUMMY_SECRET_BYTES).toString('hex'));
  return dummyHashPromise;
}

export interface AuthenticatedUser {
  id: string;
  sessionVersion: number;
}

export async function authenticate({
  email,
  password,
}: Pick<LoginInput, 'email' | 'password'>): Promise<AuthenticatedUser | null> {
  const user = await userRepository.findByEmail(email);
  if (!user || !user.isActive) {
    await verifyPassword(password, await timingDummyHash());
    return null;
  }
  if (!(await verifyPassword(password, user.passwordHash))) {
    logger.info({ userId: user.id }, 'Failed login attempt');
    return null;
  }
  return { id: user.id, sessionVersion: user.sessionVersion };
}

export async function changePassword(
  mailer: Mailer,
  userId: string,
  { currentPassword, newPassword }: ChangePasswordInput,
): Promise<AuthenticatedUser> {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError('User');
  }
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new InvalidCurrentPasswordError();
  }
  const updated = await userRepository.setPassword(userId, await hashPassword(newPassword));
  logger.info({ userId }, 'Password changed');
  await runSideEffect('password-changed-email', () =>
    mailer.send({ to: user.email, ...passwordChangedEmail({ name: user.name }) }),
  );
  return { id: updated.id, sessionVersion: updated.sessionVersion };
}
