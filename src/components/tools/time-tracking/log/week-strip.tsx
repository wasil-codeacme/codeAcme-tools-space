'use client';

import type { DateKey } from '@/lib/time-tracking/date-key';
import { formatDateKey } from '@/lib/time-tracking/date-key';
import { formatDuration } from '@/lib/time-tracking/duration';
import { cn } from '@/lib/utils';

interface WeekStripProps {
  days: DateKey[];
  minutesByDay: ReadonlyMap<DateKey, number>;
  selectedKey: DateKey;
  todayKey: DateKey;
  onSelect: (dateKey: DateKey) => void;
}

const MIN_BAR_PERCENT = 6;
const FULL_PERCENT = 100;

export function WeekStrip({ days, minutesByDay, selectedKey, todayKey, onSelect }: WeekStripProps) {
  const busiestDay = Math.max(1, ...days.map((day) => minutesByDay.get(day) ?? 0));
  const selectedMonth = selectedKey.slice(0, 7);

  return (
    <div role="tablist" aria-label="Days of the week" className="grid grid-cols-7 gap-1.5 sm:gap-2">
      {days.map((dateKey) => {
        const minutes = minutesByDay.get(dateKey) ?? 0;
        const isSelected = dateKey === selectedKey;
        const isToday = dateKey === todayKey;
        const isOtherMonth = dateKey.slice(0, 7) !== selectedMonth;
        const barPercent =
          minutes === 0 ? 0 : Math.max(MIN_BAR_PERCENT, (minutes / busiestDay) * FULL_PERCENT);

        return (
          <button
            key={dateKey}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(dateKey)}
            className={cn(
              'group focus-visible:ring-ring/50 relative flex flex-col items-center gap-1 overflow-hidden rounded-xl border px-1 pt-2.5 pb-3 text-center transition-[background-color,border-color,transform] duration-200 ease-(--ease-out-quint) outline-none focus-visible:ring-3 active:scale-[0.98]',
              isSelected
                ? 'border-primary bg-primary text-primary-foreground shadow-[0_8px_24px_-12px_var(--primary)]'
                : 'bg-background hover:border-primary/30 hover:bg-accent/60',
              isOtherMonth && !isSelected && 'opacity-55',
            )}
          >
            <span
              className={cn(
                'text-[0.68rem] font-medium tracking-wider uppercase',
                isSelected ? 'text-primary-foreground/75' : 'text-muted-foreground',
              )}
            >
              {formatDateKey(dateKey, 'EEE')}
            </span>
            <span className="font-heading text-xl leading-none font-semibold">
              {formatDateKey(dateKey, 'd')}
            </span>
            <span
              className={cn(
                'font-figures text-[0.6rem] whitespace-nowrap sm:text-[0.7rem]',
                minutes === 0 && !isSelected && 'text-muted-foreground/60',
              )}
            >
              {minutes === 0 ? '—' : formatDuration(minutes)}
            </span>
            {isToday && (
              <span
                aria-label="Today"
                className={cn(
                  'absolute top-1.5 right-1.5 size-1.5 rounded-full',
                  isSelected ? 'bg-primary-foreground' : 'bg-primary',
                )}
              />
            )}
            <span
              aria-hidden
              style={{ width: `${barPercent}%` }}
              className={cn(
                'absolute bottom-0 left-1/2 h-1 -translate-x-1/2 rounded-t-full transition-[width] duration-500 ease-(--ease-out-quint)',
                isSelected ? 'bg-primary-foreground/70' : 'bg-primary/70',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
