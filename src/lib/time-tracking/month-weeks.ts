import { DAYS_PER_WEEK } from '@/lib/constants';
import {
  type DateKey,
  addDaysToKey,
  formatDateKey,
  monthEndKey,
  monthStartKey,
  weekStartKey,
} from '@/lib/time-tracking/date-key';

// Week-of-month numbering from the retainer sheets: Monday–Sunday weeks, cut at month boundaries,
// so a month has 4–6 weeks and the first and last can be partial ("Week 1 (Oct 1–4)").

export interface MonthWeek {
  index: number;
  startKey: DateKey;
  endKey: DateKey;
  rangeLabel: string;
}

export function formatRangeLabel(startKey: DateKey, endKey: DateKey): string {
  const startLabel = formatDateKey(startKey, 'MMM d');
  if (startKey === endKey) {
    return startLabel;
  }
  const sameMonth = startKey.slice(0, 7) === endKey.slice(0, 7);
  const endLabel = formatDateKey(endKey, sameMonth ? 'd' : 'MMM d');
  return `${startLabel}–${endLabel}`;
}

export function getMonthWeeks(anyDayInMonth: DateKey): MonthWeek[] {
  const firstDay = monthStartKey(anyDayInMonth);
  const lastDay = monthEndKey(anyDayInMonth);
  const weeks: MonthWeek[] = [];

  let startKey = firstDay;
  while (startKey <= lastDay) {
    const naturalEnd = addDaysToKey(weekStartKey(startKey), DAYS_PER_WEEK - 1);
    const endKey = naturalEnd < lastDay ? naturalEnd : lastDay;
    weeks.push({
      index: weeks.length + 1,
      startKey,
      endKey,
      rangeLabel: formatRangeLabel(startKey, endKey),
    });
    startKey = addDaysToKey(endKey, 1);
  }
  return weeks;
}

export function getWeekOfMonth(dateKey: DateKey): MonthWeek {
  const week = getMonthWeeks(dateKey).find(
    (candidate) => candidate.startKey <= dateKey && dateKey <= candidate.endKey,
  );
  if (!week) {
    throw new Error(`No month week contains ${dateKey}`);
  }
  return week;
}
