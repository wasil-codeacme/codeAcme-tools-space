import { DAYS_PER_TWO_WEEKS, DAYS_PER_WEEK } from '@/lib/constants';
import { addMonths } from 'date-fns';
import {
  type DateKey,
  addDaysToKey,
  formatDateKey,
  fromDateKey,
  monthEndKey,
  monthStartKey,
  toDateKey,
  weekStartKey,
} from '@/lib/time-tracking/date-key';

export const ReportPeriod = {
  WEEK: 'WEEK',
  TWO_WEEKS: 'TWO_WEEKS',
  MONTH: 'MONTH',
  // Any start and end day, e.g. one week of the month as the client's sheet cuts it.
  RANGE: 'RANGE',
} as const;

export type ReportPeriod = (typeof ReportPeriod)[keyof typeof ReportPeriod];

export const REPORT_PERIOD_LABELS: Record<ReportPeriod, string> = {
  WEEK: 'Week',
  TWO_WEEKS: '2 weeks',
  MONTH: 'Month',
  RANGE: 'Custom range',
};

export interface ResolvedPeriod {
  period: ReportPeriod;
  startKey: DateKey;
  endKey: DateKey;
  label: string;
  // Short, filename-safe identifier, e.g. "2026-10" or "2026-10-19_2026-11-01".
  slug: string;
}

function rangeLabel(startKey: DateKey, endKey: DateKey): string {
  const sameYear = startKey.slice(0, 4) === endKey.slice(0, 4);
  const start = formatDateKey(startKey, sameYear ? 'd MMM' : 'd MMM yyyy');
  return `${start} – ${formatDateKey(endKey, 'd MMM yyyy')}`;
}

export function resolvePeriod(
  period: ReportPeriod,
  anchorKey: DateKey,
  rangeEndKey?: DateKey,
): ResolvedPeriod {
  if (period === ReportPeriod.RANGE) {
    const endKey = rangeEndKey ?? anchorKey;
    const [startKey, lastKey] = anchorKey <= endKey ? [anchorKey, endKey] : [endKey, anchorKey];
    return {
      period,
      startKey,
      endKey: lastKey,
      label:
        startKey === lastKey
          ? formatDateKey(startKey, 'd MMM yyyy')
          : rangeLabel(startKey, lastKey),
      slug: `${startKey}_${lastKey}`,
    };
  }
  if (period === ReportPeriod.MONTH) {
    const startKey = monthStartKey(anchorKey);
    return {
      period,
      startKey,
      endKey: monthEndKey(anchorKey),
      label: formatDateKey(startKey, 'MMMM yyyy'),
      slug: formatDateKey(startKey, 'yyyy-MM'),
    };
  }

  const startKey = weekStartKey(anchorKey);
  const length = period === ReportPeriod.WEEK ? DAYS_PER_WEEK : DAYS_PER_TWO_WEEKS;
  const endKey = addDaysToKey(startKey, length - 1);
  return {
    period,
    startKey,
    endKey,
    label: rangeLabel(startKey, endKey),
    slug: `${startKey}_${endKey}`,
  };
}

export function shiftPeriodAnchor(
  period: ReportPeriod,
  anchorKey: DateKey,
  direction: 1 | -1,
): DateKey {
  if (period === ReportPeriod.MONTH || period === ReportPeriod.RANGE) {
    return toDateKey(addMonths(fromDateKey(monthStartKey(anchorKey)), direction));
  }
  const length = period === ReportPeriod.WEEK ? DAYS_PER_WEEK : DAYS_PER_TWO_WEEKS;
  return addDaysToKey(weekStartKey(anchorKey), direction * length);
}
