'use client';

import { useOptimistic, useTransition } from 'react';
import { toast } from 'sonner';
import { UNDO_TOAST_DURATION_MS } from '@/lib/constants';
import { reportActionError } from '@/lib/action-feedback';
import { MESSAGES } from '@/lib/messages';
import { formatDuration } from '@/lib/time-tracking/duration';
import { UsageStatus } from '@/lib/time-tracking/usage';
import {
  createTimeEntry,
  deleteTimeEntry,
  restoreTimeEntry,
  updateTimeEntry,
} from '@/server/actions/time-tracking/time-entry.actions';
import type { EntryFields } from '@/server/validators/time-tracking/time-entry.schema';
import type { MonthUsage, TimeEntryView } from '@/types/time-tracking';

type OptimisticChange =
  | { type: 'add'; entry: TimeEntryView }
  | { type: 'replace'; entry: TimeEntryView }
  | { type: 'remove'; entryId: string };

function applyChange(entries: TimeEntryView[], change: OptimisticChange): TimeEntryView[] {
  if (change.type === 'add') {
    return [...entries, change.entry];
  }
  if (change.type === 'remove') {
    return entries.filter((entry) => entry.id !== change.entryId);
  }
  return entries.map((entry) => (entry.id === change.entry.id ? change.entry : entry));
}

function warnIfOverLimit(usage: MonthUsage, clientName: string): void {
  if (usage.status === UsageStatus.LIMIT_REACHED && usage.limitMinutes !== null) {
    toast.warning(MESSAGES.ENTRY.LIMIT_REACHED(clientName, formatDuration(usage.limitMinutes)));
  }
}

function toFields(entry: TimeEntryView): EntryFields {
  return {
    clientId: entry.clientId,
    dateKey: entry.dateKey,
    durationMinutes: entry.durationMinutes,
    task: entry.task,
    categoryId: entry.categoryId,
    requestedBy: entry.requestedBy,
    link: entry.link,
    needsReview: entry.needsReview,
  };
}

// Owns the optimistic list for the Log view. Each write shows instantly, then the action's
// refresh() replaces the optimistic rows with what the server stored.
export function useEntryMutations(entries: TimeEntryView[], clientName: string) {
  const [optimisticEntries, applyOptimistic] = useOptimistic(entries, applyChange);
  const [isPending, startTransition] = useTransition();

  function create(draft: TimeEntryView): Promise<boolean> {
    return new Promise((resolve) => {
      startTransition(async () => {
        applyOptimistic({ type: 'add', entry: draft });
        const result = await createTimeEntry(toFields(draft));
        if (result.error !== undefined) {
          reportActionError(result.error);
          resolve(false);
          return;
        }
        toast.success(MESSAGES.ENTRY.CREATE_SUCCESS, {
          description: `${formatDuration(draft.durationMinutes)} · ${draft.task}`,
        });
        warnIfOverLimit(result.data.usage, clientName);
        resolve(true);
      });
    });
  }

  function update(entry: TimeEntryView): Promise<boolean> {
    return new Promise((resolve) => {
      startTransition(async () => {
        applyOptimistic({ type: 'replace', entry });
        const result = await updateTimeEntry({ ...toFields(entry), entryId: entry.id });
        if (result.error !== undefined) {
          reportActionError(result.error);
          resolve(false);
          return;
        }
        toast.success(MESSAGES.ENTRY.UPDATE_SUCCESS);
        warnIfOverLimit(result.data.usage, clientName);
        resolve(true);
      });
    });
  }

  function restore(entry: TimeEntryView) {
    startTransition(async () => {
      applyOptimistic({ type: 'add', entry });
      const result = await restoreTimeEntry({ ...toFields(entry), userId: entry.userId });
      if (result.error !== undefined) {
        reportActionError(result.error);
        return;
      }
      toast.success(MESSAGES.ENTRY.RESTORE_SUCCESS);
    });
  }

  function remove(entry: TimeEntryView) {
    startTransition(async () => {
      applyOptimistic({ type: 'remove', entryId: entry.id });
      const result = await deleteTimeEntry({ entryId: entry.id });
      if (result.error !== undefined) {
        reportActionError(result.error);
        return;
      }
      toast.success(MESSAGES.ENTRY.DELETE_SUCCESS, {
        duration: UNDO_TOAST_DURATION_MS,
        action: { label: 'Undo', onClick: () => restore(result.data) },
      });
    });
  }

  return { entries: optimisticEntries, isPending, create, update, remove };
}
