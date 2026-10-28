import { prisma } from '@/lib/prisma';
import type { WorkSessionView } from '@/types/work-timer';

const VIEW_INCLUDE = {
  user: { select: { name: true } },
  client: { select: { name: true } },
} as const;

interface SessionRow {
  id: string;
  userId: string;
  clientId: string | null;
  note: string | null;
  startedAt: Date;
  endedAt: Date | null;
  timeEntryId: string | null;
  user: { name: string };
  client: { name: string } | null;
}

function toView(row: SessionRow): WorkSessionView {
  return {
    id: row.id,
    userId: row.userId,
    userName: row.user.name,
    clientId: row.clientId,
    clientName: row.client?.name ?? null,
    note: row.note,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt?.toISOString() ?? null,
    isLogged: row.timeEntryId !== null,
  };
}

export const workSessionRepository = {
  findById(id: string) {
    return prisma.workSession.findUnique({ where: { id } });
  },

  async findRunning(userId: string): Promise<WorkSessionView | null> {
    const row = await prisma.workSession.findFirst({
      where: { userId, endedAt: null },
      include: VIEW_INCLUDE,
    });
    return row ? toView(row) : null;
  },

  async listFinished(userId: string | undefined, since: Date): Promise<WorkSessionView[]> {
    const rows = await prisma.workSession.findMany({
      where: { ...(userId ? { userId } : {}), endedAt: { not: null }, startedAt: { gte: since } },
      include: VIEW_INCLUDE,
      orderBy: { startedAt: 'desc' },
    });
    return rows.map(toView);
  },

  async create(data: {
    userId: string;
    clientId: string | null;
    note: string | null;
    startedAt: Date;
  }) {
    return toView(await prisma.workSession.create({ data, include: VIEW_INCLUDE }));
  },

  async update(
    id: string,
    data: Partial<{
      clientId: string | null;
      note: string | null;
      startedAt: Date;
      endedAt: Date;
      timeEntryId: string;
    }>,
  ): Promise<WorkSessionView> {
    return toView(await prisma.workSession.update({ where: { id }, data, include: VIEW_INCLUDE }));
  },

  async delete(id: string): Promise<void> {
    await prisma.workSession.delete({ where: { id } });
  },
};
