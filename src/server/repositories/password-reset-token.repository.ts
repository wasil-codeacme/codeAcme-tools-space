import { prisma } from '@/lib/prisma';

export const passwordResetTokenRepository = {
  // Issuing a new link retires any earlier unused ones, so only the latest email works.
  async replaceForUser(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId, usedAt: null } }),
      prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } }),
    ]);
  },

  // Marks the token used in one conditional update, so two concurrent submissions cannot both
  // succeed. Returns the owner when the token was valid, unused and unexpired.
  async consume(tokenHash: string, now: Date): Promise<string | null> {
    const token = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true },
    });
    if (!token) {
      return null;
    }
    const { count } = await prisma.passwordResetToken.updateMany({
      where: { id: token.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    return count === 1 ? token.userId : null;
  },
};
