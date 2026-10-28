import { prisma } from '@/lib/prisma';
import { type DateKey, fromDateKey, toDateKey } from '@/lib/time-tracking/date-key';
import type { DayTotal, TimeEntryView } from '@/types/time-tracking';

export interface NewTimeEntry {
  clientId: string;
  userId: string;
  categoryId: string | null;
  dateKey: DateKey;
  durationMinutes: number;
  task: string;
  requestedBy: string | null;
  link: string | null;
  needsReview: boolean;
}

export type TimeEntryChanges = Omit<NewTimeEntry, 'userId'>;

interface RangeFilter {
  clientIds: readonly string[];
  startKey: DateKey;
  endKey: DateKey;
  userId?: string;
}

const ENTRY_INCLUDE = {
  user: { select: { name: true } },
  category: { select: { name: true } },
} as const;

interface EntryRow {
  id: string;
  clientId: string;
  userId: string;
  categoryId: string | null;
  workDate: Date;
  durationMinutes: number;
  task: string;
  requestedBy: string | null;
  link: string | null;
  needsReview: boolean;
  user: { name: string };
  category: { name: string } | null;
}

function toView(row: EntryRow): TimeEntryView {
  return {
    id: row.id,
    clientId: row.clientId,
    userId: row.userId,
    userName: row.user.name,
    categoryId: row.categoryId,
    categoryName: row.category?.name ?? null,
    dateKey: toDateKey(row.workDate),
    durationMinutes: row.durationMinutes,
    task: row.task,
    requestedBy: row.requestedBy,
    link: row.link,
    needsReview: row.needsReview,
  };
}

function toRowData({ dateKey, ...rest }: TimeEntryChanges) {
  return { ...rest, workDate: fromDateKey(dateKey) };
}

function rangeWhere({ clientIds, startKey, endKey, userId }: RangeFilter) {
  return {
    clientId: { in: [...clientIds] },
    workDate: { gte: fromDateKey(startKey), lte: fromDateKey(endKey) },
    ...(userId ? { userId } : {}),
  };
}

export const timeEntryRepository = {
  findOwnership(id: string) {
    return prisma.timeEntry.findUnique({
      where: { id },
      select: { id: true, clientId: true, userId: true, categoryId: true },
    });
  },

  async listInRange(filter: RangeFilter): Promise<TimeEntryView[]> {
    const rows = await prisma.timeEntry.findMany({
      where: rangeWhere(filter),
      include: ENTRY_INCLUDE,
      orderBy: [{ workDate: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map(toView);
  },

  async create({ userId, ...changes }: NewTimeEntry): Promise<TimeEntryView> {
    const row = await prisma.timeEntry.create({
      data: { userId, ...toRowData(changes) },
      include: ENTRY_INCLUDE,
    });
    return toView(row);
  },

  // A single INSERT, so an import either lands completely or not at all.
  async createMany(entries: readonly NewTimeEntry[]): Promise<number> {
    const result = await prisma.timeEntry.createMany({
      data: entries.map(({ userId, ...changes }) => ({ userId, ...toRowData(changes) })),
    });
    return result.count;
  },

  async update(id: string, changes: TimeEntryChanges): Promise<TimeEntryView> {
    const row = await prisma.timeEntry.update({
      where: { id },
      data: toRowData(changes),
      include: ENTRY_INCLUDE,
    });
    return toView(row);
  },

  async delete(id: string): Promise<TimeEntryView> {
    const row = await prisma.timeEntry.delete({ where: { id }, include: ENTRY_INCLUDE });
    return toView(row);
  },

  async sumMinutesByClient(filter: RangeFilter): Promise<Map<string, number>> {
    const groups = await prisma.timeEntry.groupBy({
      by: ['clientId'],
      where: rangeWhere(filter),
      _sum: { durationMinutes: true },
    });
    return new Map(groups.map((group) => [group.clientId, group._sum.durationMinutes ?? 0]));
  },

  async sumMinutesByDay(filter: RangeFilter): Promise<DayTotal[]> {
    const groups = await prisma.timeEntry.groupBy({
      by: ['workDate'],
      where: rangeWhere(filter),
      _sum: { durationMinutes: true },
      orderBy: { workDate: 'asc' },
    });
    return groups.map((group) => ({
      dateKey: toDateKey(group.workDate),
      minutes: group._sum.durationMinutes ?? 0,
    }));
  },
};
