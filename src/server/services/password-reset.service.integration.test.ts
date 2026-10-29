import { describe, expect, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import { InvalidResetTokenError } from '@/server/errors';
import { requestPasswordReset, resetPassword } from '@/server/services/password-reset.service';
import { createTestUser } from '@/test/factories';
import { createFailingMailer, createRecordingMailer } from '@/test/fake-mailer';

const NOW = new Date('2026-10-29T09:00:00Z');
const NEW_PASSWORD = 'a-brand-new-password';
const THIRTY_ONE_MINUTES_MS = 31 * 60_000;

function tokenFrom(text: string | undefined): string {
  const match = text?.match(/token=([A-Za-z0-9_-]+)/);
  if (!match?.[1]) {
    throw new Error('No reset link in the email');
  }
  return decodeURIComponent(match[1]);
}

async function requestTokenFor(email: string) {
  const mailer = createRecordingMailer();
  await requestPasswordReset(mailer, { email }, NOW);
  return tokenFrom(mailer.sent[0]?.text);
}

describe('forgot password', () => {
  it('emails a link that sets a new password and signs out every session', async () => {
    const user = await createTestUser();
    const token = await requestTokenFor(user.email);

    await resetPassword(createRecordingMailer(), { token, newPassword: NEW_PASSWORD }, NOW);

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(await verifyPassword(NEW_PASSWORD, updated.passwordHash)).toBe(true);
    expect(updated.sessionVersion).toBe(user.sessionVersion + 1);
  });

  it('stores only a hash of the token', async () => {
    const user = await createTestUser();
    const token = await requestTokenFor(user.email);
    const stored = await prisma.passwordResetToken.findFirstOrThrow({ where: { userId: user.id } });
    expect(stored.tokenHash).not.toBe(token);
    expect(stored.tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('works only once', async () => {
    const user = await createTestUser();
    const token = await requestTokenFor(user.email);
    await resetPassword(createRecordingMailer(), { token, newPassword: NEW_PASSWORD }, NOW);

    await expect(
      resetPassword(createRecordingMailer(), { token, newPassword: 'yet-another-password' }, NOW),
    ).rejects.toBeInstanceOf(InvalidResetTokenError);
  });

  it('expires after thirty minutes', async () => {
    const user = await createTestUser();
    const token = await requestTokenFor(user.email);
    const later = new Date(NOW.getTime() + THIRTY_ONE_MINUTES_MS);

    await expect(
      resetPassword(createRecordingMailer(), { token, newPassword: NEW_PASSWORD }, later),
    ).rejects.toBeInstanceOf(InvalidResetTokenError);
  });

  it('retires the earlier link when a new one is requested', async () => {
    const user = await createTestUser();
    const first = await requestTokenFor(user.email);
    await requestTokenFor(user.email);

    await expect(
      resetPassword(createRecordingMailer(), { token: first, newPassword: NEW_PASSWORD }, NOW),
    ).rejects.toBeInstanceOf(InvalidResetTokenError);
  });

  it('sends nothing for unknown or deactivated emails', async () => {
    const inactive = await createTestUser(undefined, { isActive: false });
    const mailer = createRecordingMailer();
    await requestPasswordReset(mailer, { email: 'nobody@example.test' }, NOW);
    await requestPasswordReset(mailer, { email: inactive.email }, NOW);
    expect(mailer.sent).toHaveLength(0);
  });

  it('still resets the password when the confirmation email fails', async () => {
    const user = await createTestUser();
    const token = await requestTokenFor(user.email);
    await resetPassword(createFailingMailer(), { token, newPassword: NEW_PASSWORD }, NOW);

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(await verifyPassword(NEW_PASSWORD, updated.passwordHash)).toBe(true);
  });
});
