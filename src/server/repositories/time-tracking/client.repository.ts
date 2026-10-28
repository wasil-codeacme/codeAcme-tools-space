import { prisma } from '@/lib/prisma';
import type { ClientSummary } from '@/types/time-tracking';

const CLIENT_FIELDS = {
  id: true,
  name: true,
  slug: true,
  contactName: true,
  monthlyLimitMinutes: true,
  isArchived: true,
} as const;

interface ClientData {
  name: string;
  slug: string;
  contactName: string | null;
  monthlyLimitMinutes: number | null;
}

interface ListOptions {
  includeArchived: boolean;
  memberUserId?: string;
}

export const clientRepository = {
  findById(id: string): Promise<ClientSummary | null> {
    return prisma.client.findUnique({ where: { id }, select: CLIENT_FIELDS });
  },

  findBySlug(slug: string): Promise<ClientSummary | null> {
    return prisma.client.findUnique({ where: { slug }, select: CLIENT_FIELDS });
  },

  list({ includeArchived, memberUserId }: ListOptions): Promise<ClientSummary[]> {
    return prisma.client.findMany({
      where: {
        ...(includeArchived ? {} : { isArchived: false }),
        ...(memberUserId ? { members: { some: { userId: memberUserId } } } : {}),
      },
      select: CLIENT_FIELDS,
      orderBy: [{ isArchived: 'asc' }, { name: 'asc' }],
    });
  },

  create(data: ClientData): Promise<ClientSummary> {
    return prisma.client.create({ data, select: CLIENT_FIELDS });
  },

  update(id: string, data: Partial<ClientData> & { isArchived?: boolean }): Promise<ClientSummary> {
    return prisma.client.update({ where: { id }, data, select: CLIENT_FIELDS });
  },
};
