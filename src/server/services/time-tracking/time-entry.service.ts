import 'server-only';
import { DAYS_PER_WEEK } from '@/lib/constants';
import { logger } from '@/lib/logger';
import {
  type DateKey,
  addDaysToKey,
  formatDateKey,
  monthEndKey,
  monthStartKey,
  weekStartKey,
} from '@/lib/time-tracking/date-key';
import { toMonthUsage } from '@/lib/time-tracking/usage';
import { InvalidCategoryError, NotFoundError } from '@/server/errors';
import {
  assertCanModifyEntry,
  assertClientAccess,
  isAdmin,
} from '@/server/policies/client-access.policy';
import { timeCategoryRepository } from '@/server/repositories/time-tracking/time-category.repository';
import { timeEntryRepository } from '@/server/repositories/time-tracking/time-entry.repository';
import type { Actor } from '@/types/auth';
import type {
  ClientSummary,
  EntryWriteResult,
  LogView,
  MonthUsage,
  TimeEntryView,
} from '@/types/time-tracking';
import type {
  DeleteEntryInput,
  EntryFields,
  ImportEntriesInput,
  RestoreEntryInput,
  UpdateEntryInput,
} from '@/server/validators/time-tracking/time-entry.schema';

async function monthUsageFor(client: ClientSummary, dateKey: DateKey): Promise<MonthUsage> {
  const used = await timeEntryRepository.sumMinutesByClient({
    clientIds: [client.id],
    startKey: monthStartKey(dateKey),
    endKey: monthEndKey(dateKey),
  });
  return toMonthUsage(
    used.get(client.id) ?? 0,
    client.monthlyLimitMinutes,
    formatDateKey(dateKey, 'MMMM yyyy'),
  );
}

// An entry may keep a category that was archived after it was logged, but new picks must be live.
async function assertCategory(
  clientId: string,
  categoryId: string | null,
  currentCategoryId: string | null = null,
): Promise<void> {
  if (categoryId === null || categoryId === currentCategoryId) {
    return;
  }
  const category = await timeCategoryRepository.findById(categoryId);
  if (!category || category.clientId !== clientId || category.isArchived) {
    throw new InvalidCategoryError();
  }
}

export async function getLogView(
  actor: Actor,
  { clientId, dateKey, memberId }: { clientId: string; dateKey: DateKey; memberId?: string },
): Promise<LogView> {
  const client = await assertClientAccess(actor, clientId, { allowArchived: isAdmin(actor) });
  const startKey = weekStartKey(dateKey);
  const endKey = addDaysToKey(startKey, DAYS_PER_WEEK - 1);
  // Members only ever see their own entries; admins may narrow to one member.
  const userId = isAdmin(actor) ? memberId : actor.id;
  const filter = { clientIds: [client.id], startKey, endKey, userId };

  const [entries, monthUsage] = await Promise.all([
    timeEntryRepository.listInRange(filter),
    monthUsageFor(client, dateKey),
  ]);

  return { weekStartKey: startKey, weekEndKey: endKey, entries, monthUsage };
}

export async function logEntry(actor: Actor, fields: EntryFields): Promise<EntryWriteResult> {
  const client = await assertClientAccess(actor, fields.clientId);
  await assertCategory(client.id, fields.categoryId);
  const entry = await timeEntryRepository.create({ ...fields, userId: actor.id });
  logger.info({ entryId: entry.id, clientId: client.id, userId: actor.id }, 'Time logged');
  return { entry, clientName: client.name, usage: await monthUsageFor(client, entry.dateKey) };
}

async function loadModifiableEntry(actor: Actor, entryId: string) {
  const existing = await timeEntryRepository.findOwnership(entryId);
  if (!existing) {
    throw new NotFoundError('Time entry');
  }
  assertCanModifyEntry(actor, existing.userId);
  return existing;
}

export async function updateEntry(
  actor: Actor,
  { entryId, ...fields }: UpdateEntryInput,
): Promise<EntryWriteResult> {
  const existing = await loadModifiableEntry(actor, entryId);
  const client = await assertClientAccess(actor, fields.clientId);
  const keepableCategoryId = existing.clientId === client.id ? existing.categoryId : null;
  await assertCategory(client.id, fields.categoryId, keepableCategoryId);
  const entry = await timeEntryRepository.update(entryId, fields);
  logger.info({ entryId, actorId: actor.id }, 'Time entry updated');
  return { entry, clientName: client.name, usage: await monthUsageFor(client, entry.dateKey) };
}

export async function deleteEntry(
  actor: Actor,
  { entryId }: DeleteEntryInput,
): Promise<TimeEntryView> {
  const existing = await loadModifiableEntry(actor, entryId);
  await assertClientAccess(actor, existing.clientId, { allowArchived: isAdmin(actor) });
  const deleted = await timeEntryRepository.delete(entryId);
  logger.info({ entryId, actorId: actor.id }, 'Time entry deleted');
  return deleted;
}

// Undo for a delete: puts the entry back under its original author, which only they or an admin may do.
export async function restoreEntry(
  actor: Actor,
  { userId, ...fields }: RestoreEntryInput,
): Promise<EntryWriteResult> {
  assertCanModifyEntry(actor, userId);
  const client = await assertClientAccess(actor, fields.clientId);
  await assertCategory(client.id, fields.categoryId);
  const entry = await timeEntryRepository.create({ ...fields, userId });
  logger.info({ entryId: entry.id, actorId: actor.id }, 'Time entry restored');
  return { entry, clientName: client.name, usage: await monthUsageFor(client, entry.dateKey) };
}

export async function importEntries(
  actor: Actor,
  { clientId, categoryId, entries }: ImportEntriesInput,
): Promise<{ count: number }> {
  const client = await assertClientAccess(actor, clientId);
  await assertCategory(client.id, categoryId);
  const count = await timeEntryRepository.createMany(
    entries.map((entry) => ({
      ...entry,
      clientId: client.id,
      userId: actor.id,
      categoryId,
      requestedBy: null,
      link: null,
    })),
  );
  logger.info({ clientId, userId: actor.id, count }, 'Time entries imported');
  return { count };
}
