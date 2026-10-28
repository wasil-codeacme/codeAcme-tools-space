'use client';

import { CircleHelp, TriangleAlert } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDateKey } from '@/lib/time-tracking/date-key';
import { formatDuration } from '@/lib/time-tracking/duration';
import { groupBySheetWeek } from '@/lib/time-tracking/group-by-sheet-week';
import type { ParsedNotes } from '@/lib/time-tracking/parse-notes';
import { cn } from '@/lib/utils';

interface ParsedNotesPreviewProps {
  parsed: ParsedNotes;
  excludedLines: ReadonlySet<number>;
  onToggleLine: (lineNumber: number) => void;
}

export function ParsedNotesPreview({
  parsed,
  excludedLines,
  onToggleLine,
}: ParsedNotesPreviewProps) {
  if (parsed.entries.length === 0 && parsed.skipped.length === 0) {
    return (
      <div className="text-muted-foreground flex min-h-72 items-center justify-center rounded-xl border border-dashed p-6 text-center text-sm">
        A preview of what will be logged shows up here as you paste.
      </div>
    );
  }

  return (
    <ScrollArea className="h-72 rounded-xl border md:h-[50svh]">
      <div className="space-y-4 p-3">
        {groupBySheetWeek(parsed.entries, (entry) => !excludedLines.has(entry.lineNumber)).map(
          (month) => (
            <div key={month.monthLabel} className="space-y-3">
              {month.weeks.map((week) => (
                <div key={week.index} className="space-y-2">
                  <p className="text-primary flex items-baseline justify-between px-1 text-xs font-semibold tracking-wide uppercase">
                    <span>
                      Week {week.index} · {week.rangeLabel}
                    </span>
                    <span className="font-figures normal-case">
                      {formatDuration(week.totalMinutes)}
                    </span>
                  </p>
                  {week.days.map((day) => (
                    <div key={day.dateKey} className="space-y-1">
                      <p className="text-muted-foreground flex items-baseline justify-between px-1 text-xs font-medium">
                        <span>{formatDateKey(day.dateKey, 'EEE d MMM yyyy')}</span>
                        <span className="font-figures">{formatDuration(day.totalMinutes)}</span>
                      </p>
                      {day.items.map((entry) => {
                        const isIncluded = !excludedLines.has(entry.lineNumber);
                        return (
                          <label
                            key={entry.lineNumber}
                            className={cn(
                              'hover:bg-muted/60 flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5',
                              !isIncluded && 'opacity-45',
                            )}
                          >
                            <Checkbox
                              checked={isIncluded}
                              onCheckedChange={() => onToggleLine(entry.lineNumber)}
                              className="mt-0.5"
                            />
                            <span className="font-figures text-primary w-14 shrink-0 text-xs leading-5">
                              {formatDuration(entry.durationMinutes)}
                            </span>
                            <span className="flex-1 text-sm leading-5">{entry.task}</span>
                            {entry.needsReview && (
                              <CircleHelp
                                className="mt-0.5 size-3.5 shrink-0 text-amber-600"
                                aria-label="Needs review"
                              />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
              <p className="bg-accent text-accent-foreground flex items-baseline justify-between rounded-lg px-3 py-2 text-sm font-semibold">
                <span>{month.monthLabel} total</span>
                <span className="font-figures">{formatDuration(month.totalMinutes)}</span>
              </p>
            </div>
          ),
        )}
        {parsed.skipped.length > 0 && (
          <div className="bg-muted/50 space-y-1 rounded-lg p-2.5">
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
              <TriangleAlert className="size-3.5" />
              Not imported (no duration found)
            </p>
            {parsed.skipped.map((line) => (
              <p key={line.lineNumber} className="text-muted-foreground truncate text-xs">
                <span className="font-figures mr-2">L{line.lineNumber}</span>
                {line.text}
              </p>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
