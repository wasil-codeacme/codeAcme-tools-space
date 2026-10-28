import { prisma } from '@/lib/prisma';
import type { ClientMemberView } from '@/types/time-tracking';

export const clientMemberRepository = {
  async exists(clientId: string, userId: string): Promise<boolean> {
    const membership = await prisma.clientMember.findUnique({
      where: { clientId_userId: { clientId, userId } },
      select: { id: true },
    });
    return membership !== null;
  },

  async listByClient(clientId: string): Promise<ClientMemberView[]> {
    const memberships = await prisma.clientMember.findMany({
      where: { clientId },
      select: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { user: { name: 'asc' } },
    });
    return memberships.map(({ user }) => ({ userId: user.id, name: user.name, email: user.email }));
  },

  async add(clientId: string, userId: string): Promise<void> {
    await prisma.clientMember.upsert({
      where: { clientId_userId: { clientId, userId } },
      create: { clientId, userId },
      update: {},
    });
  },

  async remove(clientId: string, userId: string): Promise<void> {
    await prisma.clientMember.deleteMany({ where: { clientId, userId } });
  },
};
