import { type DateKey } from '@/lib/time-tracking/date-key';
import { monthStartKey, weekStartKey } from '@/lib/time-tracking/date-key';

export interface DayMinutes {
  dateKey: DateKey;
  minutes: number;
}

export interface MyHoursSummary {
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
}

// The earliest day the summary needs: a week can start in the previous month.
export function summaryStartKey(today: DateKey): DateKey {
  const weekStart = weekStartKey(today);
  const monthStart = monthStartKey(today);
  return weekStart < monthStart ? weekStart : monthStart;
}

export function summarizeMyHours(days: readonly DayMinutes[], today: DateKey): MyHoursSummary {
  const weekStart = weekStartKey(today);
  const monthStart = monthStartKey(today);
  const sumFrom = (startKey: DateKey) =>
    days
      .filter((day) => day.dateKey >= startKey && day.dateKey <= today)
      .reduce((total, day) => total + day.minutes, 0);
  return {
    todayMinutes: sumFrom(today),
    weekMinutes: sumFrom(weekStart),
    monthMinutes: sumFrom(monthStart),
  };
}
