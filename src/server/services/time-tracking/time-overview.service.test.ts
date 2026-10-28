import { describe, expect, it } from 'vitest';
import { UsageStatus } from '@/lib/time-tracking/usage';
import { buildYearOverview } from '@/server/services/time-tracking/time-overview.service';

describe('buildYearOverview', () => {
  it('reproduces the yearly sheet: weeks per month, totals, limit and status', () => {
    const overview = buildYearOverview(2026, 20 * 60, [
      { dateKey: '2026-10-21', minutes: 70 },
      { dateKey: '2026-10-23', minutes: 35 },
      { dateKey: '2026-10-24', minutes: 15 },
      { dateKey: '2026-10-27', minutes: 105 },
    ]);
    const october = overview.months[9];

    expect(overview.months).toHaveLength(12);
    expect(october?.label).toBe('October 2026');
    expect(october?.weeks.map((week) => week.minutes)).toEqual([0, 0, 0, 120, 105]);
    expect(october?.usage).toMatchObject({
      usedMinutes: 225,
      remainingMinutes: 975,
      status: UsageStatus.WITHIN_LIMIT,
    });
    expect(overview.totalMinutes).toBe(225);
  });
});
