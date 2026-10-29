import 'server-only';
import { PASSWORD_RESET_TTL_MINUTES } from '@/lib/constants';
import { passwordChangedEmail, passwordResetEmail } from '@/lib/emails/account-emails';
import { logger } from '@/lib/logger';
import { hashPassword } from '@/lib/password';
import { generateResetToken, hashResetToken } from '@/lib/password-reset-token';
import { InvalidResetTokenError } from '@/server/errors';
import type { Mailer } from '@/server/ports/mailer.port';
import { passwordResetTokenRepository } from '@/server/repositories/password-reset-token.repository';
import { userRepository } from '@/server/repositories/user.repository';
import { runSideEffect } from '@/server/side-effect';
import type {
  RequestPasswordResetInput,
  ResetPasswordInput,
} from '@/server/validators/auth.schema';

const MILLISECONDS_PER_MINUTE = 60_000;

// Unknown and inactive emails get exactly the same outcome as real ones, so the form cannot be
// used to discover who has an account.
export async function requestPasswordReset(
  mailer: Mailer,
  { email }: RequestPasswordResetInput,
  now: Date,
): Promise<void> {
  const user = await userRepository.findByEmail(email);
  if (!user || !user.isActive) {
    return;
  }
  const token = generateResetToken();
  const expiresAt = new Date(now.getTime() + PASSWORD_RESET_TTL_MINUTES * MILLISECONDS_PER_MINUTE);
  await passwordResetTokenRepository.replaceForUser(user.id, hashResetToken(token), expiresAt);
  await mailer.send({ to: user.email, ...passwordResetEmail({ name: user.name, token }) });
  logger.info({ userId: user.id }, 'Password reset link sent');
}

// Setting the password bumps the session version, which signs the user out everywhere.
export async function resetPassword(
  mailer: Mailer,
  { token, newPassword }: Pick<ResetPasswordInput, 'token' | 'newPassword'>,
  now: Date,
): Promise<void> {
  const userId = await passwordResetTokenRepository.consume(hashResetToken(token), now);
  const user = userId ? await userRepository.findById(userId) : null;
  if (!user || !user.isActive) {
    throw new InvalidResetTokenError();
  }
  await userRepository.setPassword(user.id, await hashPassword(newPassword));
  logger.info({ userId: user.id }, 'Password reset with emailed link');
  await runSideEffect('password-changed-email', () =>
    mailer.send({ to: user.email, ...passwordChangedEmail({ name: user.name }) }),
  );
}
