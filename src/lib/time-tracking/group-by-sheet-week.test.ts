import { describe, expect, it } from 'vitest';
import { groupBySheetWeek } from '@/lib/time-tracking/group-by-sheet-week';

const ITEMS = [
  { id: 'a', dateKey: '2026-10-21', durationMinutes: 30 },
  { id: 'b', dateKey: '2026-10-21', durationMinutes: 70 },
  { id: 'c', dateKey: '2026-10-23', durationMinutes: 35 },
  { id: 'd', dateKey: '2026-10-27', durationMinutes: 105 },
  { id: 'e', dateKey: '2026-11-02', durationMinutes: 15 },
];

describe('groupBySheetWeek', () => {
  it('totals days, sheet weeks and months from the items', () => {
    const months = groupBySheetWeek(ITEMS);

    expect(months.map((month) => [month.monthLabel, month.totalMinutes])).toEqual([
      ['October 2026', 240],
      ['November 2026', 15],
    ]);
    expect(
      months[0]?.weeks.map((week) => [week.index, week.rangeLabel, week.totalMinutes]),
    ).toEqual([
      [4, 'Oct 19–25', 135],
      [5, 'Oct 26–31', 105],
    ]);
    expect(months[0]?.weeks[0]?.days.map((day) => day.totalMinutes)).toEqual([100, 35]);
  });

  it('leaves excluded items out of every total but keeps them listed', () => {
    const months = groupBySheetWeek(ITEMS, (item) => item.id !== 'b');
    expect(months[0]?.totalMinutes).toBe(170);
    expect(months[0]?.weeks[0]?.days[0]?.items).toHaveLength(2);
  });
});
