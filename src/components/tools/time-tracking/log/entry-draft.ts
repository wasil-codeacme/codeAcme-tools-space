import { NO_CATEGORY } from '@/components/tools/time-tracking/log/entry-form';
import type { DateKey } from '@/lib/time-tracking/date-key';
import { formatDuration } from '@/lib/time-tracking/duration';
import { parseDuration } from '@/lib/time-tracking/parse-duration';
import type { EntryFormValues } from '@/server/validators/time-tracking/time-entry.schema';
import type { CategoryOption, TimeEntryView } from '@/types/time-tracking';

export interface DraftContext {
  clientId: string;
  dateKey: DateKey;
  author: { id: string; name: string };
  categories: readonly Pick<CategoryOption, 'id' | 'name'>[];
}

const OPTIMISTIC_ID_PREFIX = 'optimistic-';

export function isOptimisticEntry(entry: TimeEntryView): boolean {
  return entry.id.startsWith(OPTIMISTIC_ID_PREFIX);
}

// Builds the row shown instantly while the server saves it; `base` keeps id/author when editing.
export function draftFromForm(
  values: EntryFormValues,
  context: DraftContext,
  base?: TimeEntryView,
): TimeEntryView {
  const categoryId = values.categoryId === NO_CATEGORY ? null : values.categoryId;
  return {
    id: base?.id ?? `${OPTIMISTIC_ID_PREFIX}${crypto.randomUUID()}`,
    clientId: context.clientId,
    userId: base?.userId ?? context.author.id,
    userName: base?.userName ?? context.author.name,
    categoryId,
    categoryName:
      context.categories.find((category) => category.id === categoryId)?.name ??
      (categoryId === base?.categoryId ? (base?.categoryName ?? null) : null),
    dateKey: base?.dateKey ?? context.dateKey,
    durationMinutes: parseDuration(values.duration) ?? 0,
    task: values.task.trim(),
    requestedBy: values.requestedBy.trim() || null,
    link: values.link.trim() || null,
    needsReview: values.needsReview,
  };
}

export function formFromEntry(entry: TimeEntryView): EntryFormValues {
  return {
    duration: formatDuration(entry.durationMinutes),
    task: entry.task,
    categoryId: entry.categoryId ?? NO_CATEGORY,
    requestedBy: entry.requestedBy ?? '',
    link: entry.link ?? '',
    needsReview: entry.needsReview,
  };
}
