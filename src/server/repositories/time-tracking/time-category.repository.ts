import { prisma } from '@/lib/prisma';
import type { CategoryOption } from '@/types/time-tracking';

const CATEGORY_FIELDS = {
  id: true,
  clientId: true,
  name: true,
  sortOrder: true,
  isArchived: true,
} as const;

export const timeCategoryRepository = {
  findById(id: string): Promise<CategoryOption | null> {
    return prisma.timeCategory.findUnique({ where: { id }, select: CATEGORY_FIELDS });
  },

  listByClients(clientIds: readonly string[], includeArchived: boolean): Promise<CategoryOption[]> {
    return prisma.timeCategory.findMany({
      where: {
        clientId: { in: [...clientIds] },
        ...(includeArchived ? {} : { isArchived: false }),
      },
      select: CATEGORY_FIELDS,
      orderBy: [{ isArchived: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
  },

  async nameExists(clientId: string, name: string, excludeId?: string): Promise<boolean> {
    const match = await prisma.timeCategory.findFirst({
      where: {
        clientId,
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return match !== null;
  },

  async create(clientId: string, name: string): Promise<CategoryOption> {
    const last = await prisma.timeCategory.findFirst({
      where: { clientId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    return prisma.timeCategory.create({
      data: { clientId, name, sortOrder: (last?.sortOrder ?? 0) + 1 },
      select: CATEGORY_FIELDS,
    });
  },

  update(id: string, data: { name?: string; isArchived?: boolean }): Promise<CategoryOption> {
    return prisma.timeCategory.update({ where: { id }, data, select: CATEGORY_FIELDS });
  },
};
