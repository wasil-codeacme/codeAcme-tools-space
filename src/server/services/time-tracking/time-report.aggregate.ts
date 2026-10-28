import { type DateKey, daysBetweenKeys, formatDateKey } from '@/lib/time-tracking/date-key';
import { getMonthWeeks } from '@/lib/time-tracking/month-weeks';
import { ReportPeriod, type ResolvedPeriod } from '@/lib/time-tracking/report-period';
import { toMonthUsage } from '@/lib/time-tracking/usage';
import {
  BreakdownKind,
  type ReportBreakdownRow,
  type ReportDay,
  type ReportShareRow,
  type TimeReport,
} from '@/types/time-report';
import type { ClientSummary, TimeEntryView } from '@/types/time-tracking';

export const NOT_CATEGORISED_LABEL = 'Not categorised';
const DAY_LABEL_FORMAT = 'EEE d MMM yyyy';

interface AggregateInput {
  client: Pick<ClientSummary, 'name' | 'slug' | 'contactName' | 'monthlyLimitMinutes'>;
  period: ResolvedPeriod;
  entries: readonly TimeEntryView[];
  generatedOn: DateKey;
}

function sumMinutes(entries: readonly TimeEntryView[]): number {
  return entries.reduce((sum, entry) => sum + entry.durationMinutes, 0);
}

function shareRows(
  entries: readonly TimeEntryView[],
  labelOf: (entry: TimeEntryView) => string,
  totalMinutes: number,
): ReportShareRow[] {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    const label = labelOf(entry);
    totals.set(label, (totals.get(label) ?? 0) + entry.durationMinutes);
  }
  return [...totals.entries()]
    .map(([label, minutes]) => ({
      label,
      minutes,
      share: totalMinutes === 0 ? 0 : minutes / totalMinutes,
    }))
    .sort((left, right) => right.minutes - left.minutes);
}

function minutesBetween(entries: readonly TimeEntryView[], startKey: DateKey, endKey: DateKey) {
  return sumMinutes(
    entries.filter((entry) => entry.dateKey >= startKey && entry.dateKey <= endKey),
  );
}

function buildBreakdown(period: ResolvedPeriod, entries: readonly TimeEntryView[]) {
  if (period.period === ReportPeriod.MONTH) {
    const rows: ReportBreakdownRow[] = getMonthWeeks(period.startKey).map((week) => ({
      label: `Week ${week.index}`,
      detail: week.rangeLabel,
      minutes: minutesBetween(entries, week.startKey, week.endKey),
    }));
    return { breakdownKind: BreakdownKind.WEEK, breakdown: rows };
  }
  const rows: ReportBreakdownRow[] = daysBetweenKeys(period.startKey, period.endKey).map(
    (dateKey) => ({
      label: formatDateKey(dateKey, 'EEEE'),
      detail: formatDateKey(dateKey, 'd MMM'),
      minutes: minutesBetween(entries, dateKey, dateKey),
    }),
  );
  return { breakdownKind: BreakdownKind.DAY, breakdown: rows };
}

function buildDays(entries: readonly TimeEntryView[]): ReportDay[] {
  const byDay = new Map<DateKey, TimeEntryView[]>();
  for (const entry of entries) {
    byDay.set(entry.dateKey, [...(byDay.get(entry.dateKey) ?? []), entry]);
  }
  return [...byDay.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([dateKey, dayEntries]) => ({
      dateKey,
      label: formatDateKey(dateKey, DAY_LABEL_FORMAT),
      totalMinutes: sumMinutes(dayEntries),
      entries: dayEntries.map((entry) => ({
        durationMinutes: entry.durationMinutes,
        task: entry.task,
        categoryName: entry.categoryName,
        requestedBy: entry.requestedBy,
        link: entry.link,
        needsReview: entry.needsReview,
        userName: entry.userName,
      })),
    }));
}

export function aggregateTimeReport({
  client,
  period,
  entries,
  generatedOn,
}: AggregateInput): TimeReport {
  const inPeriod = entries.filter(
    (entry) => entry.dateKey >= period.startKey && entry.dateKey <= period.endKey,
  );
  const totalMinutes = sumMinutes(inPeriod);
  const showsUsage = period.period === ReportPeriod.MONTH && client.monthlyLimitMinutes !== null;

  return {
    client: { name: client.name, slug: client.slug, contactName: client.contactName },
    period,
    generatedOn,
    totalMinutes,
    entryCount: inPeriod.length,
    needsReviewCount: inPeriod.filter((entry) => entry.needsReview).length,
    usage: showsUsage ? toMonthUsage(totalMinutes, client.monthlyLimitMinutes, period.label) : null,
    ...buildBreakdown(period, inPeriod),
    byCategory: shareRows(
      inPeriod,
      (entry) => entry.categoryName ?? NOT_CATEGORISED_LABEL,
      totalMinutes,
    ),
    byMember: shareRows(inPeriod, (entry) => entry.userName, totalMinutes),
    days: buildDays(inPeriod),
  };
}
