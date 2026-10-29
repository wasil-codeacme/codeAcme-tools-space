import { describe, expect, it } from 'vitest';
import { ReportPeriod, resolvePeriod } from '@/lib/time-tracking/report-period';
import { UsageStatus } from '@/lib/time-tracking/usage';
import {
  NOT_CATEGORISED_LABEL,
  aggregateTimeReport,
} from '@/server/services/time-tracking/time-report.aggregate';
import { BreakdownKind } from '@/types/time-report';
import type { TimeEntryView } from '@/types/time-tracking';

const CLIENT = {
  name: 'The 30k Club',
  slug: 'the-30k-club',
  contactName: 'Anna & Jo',
  monthlyLimitMinutes: 20 * 60,
};

function entry(
  dateKey: string,
  durationMinutes: number,
  overrides: Partial<TimeEntryView> = {},
): TimeEntryView {
  return {
    id: `${dateKey}-${durationMinutes}`,
    clientId: 'client',
    userId: 'user-1',
    userName: 'Dev One',
    categoryId: null,
    categoryName: null,
    dateKey,
    durationMinutes,
    task: 'Work',
    requestedBy: null,
    link: null,
    needsReview: false,
    ...overrides,
  };
}

const OCTOBER_ENTRIES = [
  entry('2026-10-21', 70, { categoryId: 'calls', categoryName: 'Calls and messages' }),
  entry('2026-10-23', 35),
  entry('2026-10-24', 15, { needsReview: true }),
  entry('2026-10-27', 105, {
    userId: 'user-2',
    userName: 'Dev Two',
    categoryId: 'calls',
    categoryName: 'Calls and messages',
  }),
  entry('2026-11-02', 60),
];

describe('aggregateTimeReport', () => {
  const report = aggregateTimeReport({
    client: CLIENT,
    period: resolvePeriod(ReportPeriod.MONTH, '2026-10-01'),
    entries: OCTOBER_ENTRIES,
    generatedOn: '2026-10-28',
  });

  it('totals only entries inside the period, in exact minutes', () => {
    expect(report.totalMinutes).toBe(225);
    expect(report.entryCount).toBe(4);
    expect(report.needsReviewCount).toBe(1);
  });

  it('breaks a month down into the sheet weeks', () => {
    expect(report.breakdownKind).toBe(BreakdownKind.WEEK);
    expect(report.breakdown.map((row) => [row.detail, row.minutes])).toEqual([
      ['Oct 1–4', 0],
      ['Oct 5–11', 0],
      ['Oct 12–18', 0],
      ['Oct 19–25', 120],
      ['Oct 26–31', 105],
    ]);
  });

  it('groups by category with a "Not categorised" bucket and shares that sum to one', () => {
    expect(report.byCategory).toEqual([
      { label: 'Calls and messages', minutes: 175, share: 175 / 225 },
      { label: NOT_CATEGORISED_LABEL, minutes: 50, share: 50 / 225 },
    ]);
  });

  it('shows retainer usage on month reports for capped clients', () => {
    expect(report.usage).toMatchObject({
      limitMinutes: 1200,
      remainingMinutes: 975,
      status: UsageStatus.WITHIN_LIMIT,
    });
  });

  it('groups the log by day in date order', () => {
    expect(report.days.map((day) => [day.label, day.totalMinutes])).toEqual([
      ['Wed 21 Oct 2026', 70],
      ['Fri 23 Oct 2026', 35],
      ['Sat 24 Oct 2026', 15],
      ['Tue 27 Oct 2026', 105],
    ]);
  });

  it('breaks week reports down by day and leaves out usage', () => {
    const weekly = aggregateTimeReport({
      client: CLIENT,
      period: resolvePeriod(ReportPeriod.WEEK, '2026-10-21'),
      entries: OCTOBER_ENTRIES,
      generatedOn: '2026-10-28',
    });
    expect(weekly.breakdownKind).toBe(BreakdownKind.DAY);
    expect(weekly.breakdown).toHaveLength(7);
    expect(weekly.usage).toBeNull();
    expect(weekly.totalMinutes).toBe(120);
  });

  it('breaks a long custom range into Monday-to-Sunday weeks clipped to the range', () => {
    const report = aggregateTimeReport({
      client: {
        name: 'The 30k Club',
        slug: 'the-30k-club',
        contactName: null,
        monthlyLimitMinutes: null,
      },
      period: resolvePeriod(ReportPeriod.RANGE, '2026-10-08', '2026-10-28'),
      entries: [],
      generatedOn: '2026-10-29',
    });
    expect(report.breakdownKind).toBe(BreakdownKind.WEEK);
    expect(report.breakdown.map((row) => row.detail)).toEqual([
      'Oct 8–11',
      'Oct 12–18',
      'Oct 19–25',
      'Oct 26–28',
    ]);
  });
});
