import 'server-only';
import { formatDateKey } from '@/lib/time-tracking/date-key';
import { getMonthWeeks } from '@/lib/time-tracking/month-weeks';
import { toMonthUsage } from '@/lib/time-tracking/usage';
import { assertClientAccess } from '@/server/policies/client-access.policy';
import { timeEntryRepository } from '@/server/repositories/time-tracking/time-entry.repository';
import type { Actor } from '@/types/auth';
import type { DayTotal, OverviewMonthRow, YearOverview } from '@/types/time-tracking';

const MONTHS_PER_YEAR = 12;

function sumBetween(dayTotals: readonly DayTotal[], startKey: string, endKey: string): number {
  return dayTotals
    .filter((day) => day.dateKey >= startKey && day.dateKey <= endKey)
    .reduce((sum, day) => sum + day.minutes, 0);
}

export function buildYearOverview(
  year: number,
  monthlyLimitMinutes: number | null,
  dayTotals: readonly DayTotal[],
): YearOverview {
  const months: OverviewMonthRow[] = Array.from({ length: MONTHS_PER_YEAR }, (_, monthIndex) => {
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
    const weeks = getMonthWeeks(monthKey).map((week) => ({
      ...week,
      minutes: sumBetween(dayTotals, week.startKey, week.endKey),
    }));
    const usedMinutes = weeks.reduce((sum, week) => sum + week.minutes, 0);
    const label = formatDateKey(monthKey, 'MMMM yyyy');
    return { monthKey, label, weeks, usage: toMonthUsage(usedMinutes, monthlyLimitMinutes, label) };
  });

  return {
    year,
    months,
    totalMinutes: months.reduce((sum, month) => sum + month.usage.usedMinutes, 0),
  };
}

// Client-wide totals (every member), mirroring the yearly summary sheet.
export async function getYearOverview(
  actor: Actor,
  { clientId, year }: { clientId: string; year: number },
): Promise<YearOverview> {
  const client = await assertClientAccess(actor, clientId, { allowArchived: true });
  const dayTotals = await timeEntryRepository.sumMinutesByDay({
    clientIds: [client.id],
    startKey: `${year}-01-01`,
    endKey: `${year}-12-31`,
  });
  return buildYearOverview(year, client.monthlyLimitMinutes, dayTotals);
}
