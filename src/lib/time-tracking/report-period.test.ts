import { describe, expect, it } from 'vitest';
import { ReportPeriod, resolvePeriod, shiftPeriodAnchor } from '@/lib/time-tracking/report-period';

describe('resolvePeriod', () => {
  it('resolves a week to the Monday–Sunday that contains the anchor', () => {
    expect(resolvePeriod(ReportPeriod.WEEK, '2026-10-21')).toMatchObject({
      startKey: '2026-10-19',
      endKey: '2026-10-25',
      label: '19 Oct – 25 Oct 2026',
    });
  });

  it('resolves two weeks starting from the anchor week Monday', () => {
    expect(resolvePeriod(ReportPeriod.TWO_WEEKS, '2026-10-21')).toMatchObject({
      startKey: '2026-10-19',
      endKey: '2026-11-01',
      slug: '2026-10-19_2026-11-01',
    });
  });

  it('resolves a month to the calendar month', () => {
    expect(resolvePeriod(ReportPeriod.MONTH, '2026-02-14')).toMatchObject({
      startKey: '2026-02-01',
      endKey: '2026-02-28',
      label: 'February 2026',
      slug: '2026-02',
    });
  });

  it('labels ranges that cross a year', () => {
    expect(resolvePeriod(ReportPeriod.WEEK, '2026-12-31').label).toBe('28 Dec 2026 – 3 Jan 2027');
  });
});

describe('shiftPeriodAnchor', () => {
  it('moves months by calendar month', () => {
    expect(shiftPeriodAnchor(ReportPeriod.MONTH, '2026-01-31', 1)).toBe('2026-02-01');
  });

  it('moves weeks and fortnights from the week Monday', () => {
    expect(shiftPeriodAnchor(ReportPeriod.WEEK, '2026-10-21', -1)).toBe('2026-10-12');
    expect(shiftPeriodAnchor(ReportPeriod.TWO_WEEKS, '2026-10-21', 1)).toBe('2026-11-02');
  });
});
