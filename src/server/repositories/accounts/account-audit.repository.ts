import type { AccountAuditAction } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import type { AccountAuditView } from '@/types/accounts';

export const accountAuditRepository = {
  async record(accountId: string, userId: string, action: AccountAuditAction): Promise<void> {
    await prisma.accountAuditEvent.create({ data: { accountId, userId, action } });
  },

  async recordMany(accountIds: readonly string[], userId: string, action: AccountAuditAction) {
    await prisma.accountAuditEvent.createMany({
      data: accountIds.map((accountId) => ({ accountId, userId, action })),
    });
  },

  async listRecent(take: number): Promise<AccountAuditView[]> {
    const rows = await prisma.accountAuditEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        user: { select: { name: true } },
        account: { select: { name: true, client: { select: { name: true } } } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      accountName: row.account.name,
      clientName: row.account.client?.name ?? null,
      userName: row.user.name,
      action: row.action,
      createdAt: row.createdAt.toISOString(),
    }));
  },
};
