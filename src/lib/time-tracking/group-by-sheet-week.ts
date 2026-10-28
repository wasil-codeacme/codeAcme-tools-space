import { type DateKey, formatDateKey } from '@/lib/time-tracking/date-key';
import { getWeekOfMonth } from '@/lib/time-tracking/month-weeks';

// Groups dated items into month → sheet week → day, with every total computed from the items
// themselves (never from totals people typed into their notes).

interface DatedItem {
  dateKey: DateKey;
  durationMinutes: number;
}

export interface DayGroup<Item> {
  dateKey: DateKey;
  totalMinutes: number;
  items: Item[];
}

export interface WeekGroup<Item> {
  index: number;
  rangeLabel: string;
  totalMinutes: number;
  days: DayGroup<Item>[];
}

export interface MonthGroup<Item> {
  monthLabel: string;
  totalMinutes: number;
  weeks: WeekGroup<Item>[];
}

function last<Value>(values: Value[]): Value | undefined {
  return values[values.length - 1];
}

export function groupBySheetWeek<Item extends DatedItem>(
  items: readonly Item[],
  counts: (item: Item) => boolean = () => true,
): MonthGroup<Item>[] {
  const sorted = [...items].sort((left, right) => left.dateKey.localeCompare(right.dateKey));
  const months: MonthGroup<Item>[] = [];

  for (const item of sorted) {
    const minutes = counts(item) ? item.durationMinutes : 0;
    const monthLabel = formatDateKey(item.dateKey, 'MMMM yyyy');
    const sheetWeek = getWeekOfMonth(item.dateKey);

    let month = last(months);
    if (month?.monthLabel !== monthLabel) {
      month = { monthLabel, totalMinutes: 0, weeks: [] };
      months.push(month);
    }
    let week = last(month.weeks);
    if (week?.index !== sheetWeek.index) {
      week = {
        index: sheetWeek.index,
        rangeLabel: sheetWeek.rangeLabel,
        totalMinutes: 0,
        days: [],
      };
      month.weeks.push(week);
    }
    let day = last(week.days);
    if (day?.dateKey !== item.dateKey) {
      day = { dateKey: item.dateKey, totalMinutes: 0, items: [] };
      week.days.push(day);
    }

    day.items.push(item);
    day.totalMinutes += minutes;
    week.totalMinutes += minutes;
    month.totalMinutes += minutes;
  }

  return months;
}
