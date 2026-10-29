import { describe, expect, it } from 'vitest';
import { summarizeMyHours, summaryStartKey } from '@/lib/time-tracking/my-hours';

describe('my hours summary', () => {
  it('starts from the week start when the week began last month', () => {
    // Sunday 1 November 2026 belongs to the week that started Monday 26 October.
    expect(summaryStartKey('2026-11-01')).toBe('2026-10-26');
    expect(summaryStartKey('2026-10-28')).toBe('2026-10-01');
  });

  it('totals today, the week and the month separately', () => {
    const days = [
      { dateKey: '2026-10-30', minutes: 45 },
      { dateKey: '2026-10-31', minutes: 30 },
      { dateKey: '2026-11-01', minutes: 70 },
    ];
    expect(summarizeMyHours(days, '2026-11-01')).toEqual({
      todayMinutes: 70,
      weekMinutes: 145,
      monthMinutes: 70,
    });
  });
});
