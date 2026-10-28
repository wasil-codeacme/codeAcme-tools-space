'use client';

import { useMemo, useState, useTransition } from 'react';
import { ClipboardPaste, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { NO_CATEGORY } from '@/components/tools/time-tracking/log/entry-form';
import { ParsedNotesPreview } from '@/components/tools/time-tracking/log/parsed-notes-preview';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { reportActionError } from '@/lib/action-feedback';
import { MESSAGES } from '@/lib/messages';
import type { DateKey } from '@/lib/time-tracking/date-key';
import { formatDuration } from '@/lib/time-tracking/duration';
import { parseNotes } from '@/lib/time-tracking/parse-notes';
import { importTimeEntries } from '@/server/actions/time-tracking/time-entry.actions';
import type { CategoryOption } from '@/types/time-tracking';

const NOTES_PLACEHOLDER = `time spent on 21st October
30 mins meet
20 min Collecting accounts
Meeting with Anna 1h
Bitwarden setup 15 m ??`;

interface PasteNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  categories: readonly CategoryOption[];
  defaultDateKey: DateKey;
}

export function PasteNotesDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  categories,
  defaultDateKey,
}: PasteNotesDialogProps) {
  const [text, setText] = useState('');
  const [categoryId, setCategoryId] = useState(NO_CATEGORY);
  const [excludedLines, setExcludedLines] = useState<ReadonlySet<number>>(new Set());
  const [isPending, startTransition] = useTransition();
  const parsed = useMemo(() => parseNotes(text, defaultDateKey), [text, defaultDateKey]);
  const included = parsed.entries.filter((entry) => !excludedLines.has(entry.lineNumber));
  const includedMinutes = included.reduce((sum, entry) => sum + entry.durationMinutes, 0);

  function toggleLine(lineNumber: number) {
    setExcludedLines((current) => {
      const next = new Set(current);
      if (!next.delete(lineNumber)) {
        next.add(lineNumber);
      }
      return next;
    });
  }

  function close() {
    setText('');
    setCategoryId(NO_CATEGORY);
    setExcludedLines(new Set());
    onOpenChange(false);
  }

  function submit() {
    startTransition(async () => {
      const result = await importTimeEntries({
        clientId,
        categoryId: categoryId === NO_CATEGORY ? null : categoryId,
        entries: included.map(({ dateKey, durationMinutes, task, needsReview }) => ({
          dateKey,
          durationMinutes,
          task,
          needsReview,
        })),
      });
      if (result.error !== undefined) {
        reportActionError(result.error);
        return;
      }
      toast.success(MESSAGES.ENTRY.IMPORT_SUCCESS(result.data.count));
      close();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <ClipboardPaste className="size-4" />
            Paste from notes
          </DialogTitle>
          <DialogDescription>
            Paste notes the way you already write them. Lines like “time spent on 21st October” set
            the day, and “??” marks an item for review. Everything is logged to {clientName}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid min-h-0 gap-4 md:grid-cols-2">
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={NOTES_PLACEHOLDER}
            aria-label="Notes"
            className="font-figures min-h-44 resize-none text-sm md:h-[50svh] md:min-h-72"
          />
          <ParsedNotesPreview
            parsed={parsed}
            excludedLines={excludedLines}
            onToggleLine={toggleLine}
          />
        </div>
        <DialogFooter className="items-center gap-3 sm:justify-between">
          <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
            {categories.length > 0 && (
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-44 sm:w-56" aria-label="Category for imported items">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>No category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="font-figures text-muted-foreground text-sm whitespace-nowrap">
              {included.length} items · {formatDuration(includedMinutes)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={isPending || included.length === 0}>
              {isPending && <Loader2 className="animate-spin" />}
              Import {included.length > 0 ? included.length : ''} items
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
