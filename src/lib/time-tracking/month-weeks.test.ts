import { describe, expect, it } from 'vitest';
import { getMonthWeeks, getWeekOfMonth } from '@/lib/time-tracking/month-weeks';

describe('getMonthWeeks', () => {
  it('cuts Monday–Sunday weeks at the month boundary, like the retainer sheet', () => {
    expect(getMonthWeeks('2026-10-15').map((week) => week.rangeLabel)).toEqual([
      'Oct 1–4',
      'Oct 5–11',
      'Oct 12–18',
      'Oct 19–25',
      'Oct 26–31',
    ]);
  });

  it('produces six weeks when the month needs them', () => {
    const march = getMonthWeeks('2026-03-01');
    expect(march).toHaveLength(6);
    expect(march[0]?.rangeLabel).toBe('Mar 1');
    expect(march[5]?.rangeLabel).toBe('Mar 30–31');
  });

  it('labels single-day weeks with just the day', () => {
    const november = getMonthWeeks('2026-11-10');
    expect(november[0]?.rangeLabel).toBe('Nov 1');
    expect(november.at(-1)?.rangeLabel).toBe('Nov 30');
  });
});

describe('getWeekOfMonth', () => {
  it('finds the sheet week for a date', () => {
    expect(getWeekOfMonth('2026-10-21')).toMatchObject({
      index: 4,
      startKey: '2026-10-19',
      endKey: '2026-10-25',
    });
  });
});
