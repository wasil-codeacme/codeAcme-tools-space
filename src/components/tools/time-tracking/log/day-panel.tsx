'use client';

import { type RefObject, useState } from 'react';
import { NotebookPen } from 'lucide-react';
import {
  type DraftContext,
  draftFromForm,
  formFromEntry,
} from '@/components/tools/time-tracking/log/entry-draft';
import { EntryForm } from '@/components/tools/time-tracking/log/entry-form';
import { EntryItem } from '@/components/tools/time-tracking/log/entry-item';
import { formatDateKey } from '@/lib/time-tracking/date-key';
import { formatDuration } from '@/lib/time-tracking/duration';
import type { CategoryOption, TimeEntryView } from '@/types/time-tracking';

interface DayPanelProps {
  entries: TimeEntryView[];
  context: DraftContext;
  categories: CategoryOption[];
  canModify: (entry: TimeEntryView) => boolean;
  // View-only members see the log without the quick-add row.
  canCreate: boolean;
  showAuthor: boolean;
  durationInputRef: RefObject<HTMLInputElement | null>;
  onCreate: (draft: TimeEntryView) => Promise<boolean>;
  onUpdate: (entry: TimeEntryView) => Promise<boolean>;
  onDelete: (entry: TimeEntryView) => void;
}

// An archived category stays selectable on entries that already use it.
function categoryChoices(categories: CategoryOption[], entry?: TimeEntryView) {
  const choices = categories.map(({ id, name }) => ({ id, name }));
  if (
    entry?.categoryId &&
    entry.categoryName &&
    !choices.some((choice) => choice.id === entry.categoryId)
  ) {
    choices.push({ id: entry.categoryId, name: entry.categoryName });
  }
  return choices;
}

export function DayPanel({
  entries,
  context,
  categories,
  canModify,
  canCreate,
  showAuthor,
  durationInputRef,
  onCreate,
  onUpdate,
  onDelete,
}: DayPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const dayTotal = entries.reduce((sum, entry) => sum + entry.durationMinutes, 0);

  return (
    <section className="bg-card flex min-h-80 flex-col rounded-2xl border">
      <header className="flex items-baseline justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            {formatDateKey(context.dateKey, 'EEEE d MMMM')}
          </h2>
          <p className="text-muted-foreground text-xs">
            {entries.length === 0
              ? 'Nothing logged yet'
              : `${entries.length} ${entries.length === 1 ? 'item' : 'items'}`}
          </p>
        </div>
        <span className="font-figures text-2xl font-medium tracking-tight">
          {formatDuration(dayTotal)}
        </span>
      </header>

      <div className="flex-1 px-2 py-2">
        {entries.length === 0 ? (
          <div className="text-muted-foreground flex h-full min-h-40 flex-col items-center justify-center gap-2 text-center">
            <NotebookPen className="size-5" />
            <p className="text-sm">Log the first item for this day below, or paste your notes.</p>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {entries.map((entry) =>
              editingId === entry.id ? (
                <li key={entry.id} className="py-1">
                  <EntryForm
                    mode="edit"
                    categories={categoryChoices(categories, entry)}
                    defaultValues={formFromEntry(entry)}
                    onCancel={() => setEditingId(null)}
                    onSubmit={async (values) => {
                      setEditingId(null);
                      return onUpdate(draftFromForm(values, context, entry));
                    }}
                  />
                </li>
              ) : (
                <EntryItem
                  key={entry.id}
                  entry={entry}
                  canModify={canModify(entry)}
                  showAuthor={showAuthor}
                  onEdit={() => setEditingId(entry.id)}
                  onDelete={() => onDelete(entry)}
                />
              ),
            )}
          </ul>
        )}
      </div>

      {canCreate && (
        <footer className="bg-muted/30 border-t p-3">
          <EntryForm
            mode="create"
            categories={categoryChoices(categories)}
            durationInputRef={durationInputRef}
            onSubmit={(values) => onCreate(draftFromForm(values, context))}
          />
        </footer>
      )}
    </section>
  );
}
