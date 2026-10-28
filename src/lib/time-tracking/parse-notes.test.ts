import { describe, expect, it } from 'vitest';
import { parseNotes } from '@/lib/time-tracking/parse-notes';

const OCTOBER_NOTES = `Week 4 oct 19 to 25 time : 2h

time spent on 21st october : 1h 10m
30 mins meet
30 mins Event sheet set up
20 min Collecting accounts
10 mins to decide the best password manager
10 min research

time spent on 23 rd  october : 35 m
Someone someone@example.com
5 min Added as client on Circle  with both 10k and 30k access.
10 mins misc , 2FA logins , emails

Week 5
Time spent on 27th october 1h 45m
Google workspace setup dev@30kclub 30 m ??
Meeting with Anna 1h
Setting Bitwarden and subscription 15 m ??

Time spent on 28th october

1h Kajabi setup
- 30 min bit warden plan
Sheet`;

describe('parseNotes', () => {
  const parsed = parseNotes(OCTOBER_NOTES, '2026-10-28');

  it('assigns items to the day named by the preceding heading', () => {
    const october21 = parsed.entries.filter((entry) => entry.dateKey === '2026-10-21');
    expect(october21.map((entry) => entry.durationMinutes)).toEqual([30, 30, 20, 10, 10]);
    expect(october21.reduce((sum, entry) => sum + entry.durationMinutes, 0)).toBe(100);
  });

  it('reads durations at the start or the end of a line', () => {
    const october27 = parsed.entries.filter((entry) => entry.dateKey === '2026-10-27');
    expect(october27).toEqual([
      expect.objectContaining({ durationMinutes: 30, task: 'Google workspace setup dev@30kclub' }),
      expect.objectContaining({ durationMinutes: 60, task: 'Meeting with Anna' }),
      expect.objectContaining({ durationMinutes: 15, task: 'Setting Bitwarden and subscription' }),
    ]);
  });

  it('turns "??" into a needs-review flag', () => {
    const flagged = parsed.entries.filter((entry) => entry.needsReview);
    expect(flagged.map((entry) => entry.task)).toEqual([
      'Google workspace setup dev@30kclub',
      'Setting Bitwarden and subscription',
    ]);
  });

  it('strips bullets and keeps the task text', () => {
    expect(parsed.entries).toContainEqual(
      expect.objectContaining({
        dateKey: '2026-10-28',
        durationMinutes: 30,
        task: 'bit warden plan',
      }),
    );
    expect(parsed.entries).toContainEqual(
      expect.objectContaining({ dateKey: '2026-10-28', durationMinutes: 60, task: 'Kajabi setup' }),
    );
  });

  it('reports lines without a duration instead of dropping them', () => {
    expect(parsed.skipped.map((line) => line.text)).toEqual([
      'Someone someone@example.com',
      'Sheet',
    ]);
  });

  it('falls back to the default day when there is no heading', () => {
    const result = parseNotes('15m standup\nfix login 1:05', '2026-10-28');
    expect(result.entries).toEqual([
      expect.objectContaining({ dateKey: '2026-10-28', durationMinutes: 15, task: 'standup' }),
      expect.objectContaining({ dateKey: '2026-10-28', durationMinutes: 65, task: 'fix login' }),
    ]);
  });

  it('does not mistake words that start like a month for a heading', () => {
    const result = parseNotes('15 decorations hung', '2026-10-28');
    expect(result.skipped).toHaveLength(1);
  });
});
