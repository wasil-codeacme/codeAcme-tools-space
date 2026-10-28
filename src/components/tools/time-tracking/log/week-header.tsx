'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PendingSection } from '@/components/platform/pending-navigation';
import { WeekTitleSkeleton } from '@/components/tools/time-tracking/skeletons';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { type DateKey, formatDateKey } from '@/lib/time-tracking/date-key';
import { formatDuration } from '@/lib/time-tracking/duration';
import { formatRangeLabel, getWeekOfMonth } from '@/lib/time-tracking/month-weeks';

interface WeekHeaderProps {
  weekStartKey: DateKey;
  weekEndKey: DateKey;
  selectedKey: DateKey;
  weekTotalMinutes: number;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function WeekHeader({
  weekStartKey,
  weekEndKey,
  selectedKey,
  weekTotalMinutes,
  onPrevious,
  onNext,
  onToday,
}: WeekHeaderProps) {
  // Same numbering as the retainer sheet: weeks of the selected day's month.
  const sheetWeek = getWeekOfMonth(selectedKey);

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <PendingSection fallback={<WeekTitleSkeleton />}>
        <div className="space-y-1">
          <p className="font-figures text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase">
            Week {sheetWeek.index} of {formatDateKey(selectedKey, 'MMMM')} · {sheetWeek.rangeLabel}
          </p>
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            {formatRangeLabel(weekStartKey, weekEndKey)}, {formatDateKey(weekEndKey, 'yyyy')}
          </h2>
        </div>
      </PendingSection>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-muted-foreground text-[0.7rem] tracking-wider uppercase">Week total</p>
          <PendingSection fallback={<Skeleton className="mt-1 ml-auto h-6 w-16" />}>
            <p className="font-figures text-lg font-medium">{formatDuration(weekTotalMinutes)}</p>
          </PendingSection>
        </div>
        <div className="bg-background flex items-center gap-1 rounded-xl border p-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onPrevious}
                aria-label="Previous week"
              >
                <ChevronLeft />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Previous week</TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="sm" onClick={onToday}>
            Today
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={onNext} aria-label="Next week">
                <ChevronRight />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Next week</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
