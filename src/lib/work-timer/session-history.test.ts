import { describe, expect, it } from 'vitest';
import {
  billableSessionMinutes,
  sessionMinutes,
  toHistoryItems,
} from '@/lib/work-timer/session-history';
import type { WorkSessionView } from '@/types/work-timer';

function session(startedAt: string, endedAt: string | null): WorkSessionView {
  return {
    id: startedAt,
    userId: 'user',
    userName: 'Dev',
    clientId: null,
    clientName: null,
    note: null,
    startedAt,
    endedAt,
    workedSeconds: null,
    isLogged: false,
  };
}

describe('session durations', () => {
  it('rounds to the nearest minute and never goes negative', () => {
    expect(sessionMinutes('2026-10-28T09:00:00Z', '2026-10-28T10:10:29Z')).toBe(70);
    expect(sessionMinutes('2026-10-28T10:00:00Z', '2026-10-28T09:00:00Z')).toBe(0);
  });

  it('logs at least one minute to time tracking', () => {
    expect(
      billableSessionMinutes({
        startedAt: '2026-10-28T09:00:00Z',
        endedAt: '2026-10-28T09:00:20Z',
        workedSeconds: null,
      }),
    ).toBe(1);
  });

  it('uses the pause-aware worked time when there is one', () => {
    expect(
      billableSessionMinutes({
        startedAt: '2026-10-28T09:00:00Z',
        endedAt: '2026-10-28T10:00:00Z',
        workedSeconds: 30 * 60,
      }),
    ).toBe(30);
  });
});

describe('toHistoryItems', () => {
  it('places sessions on the local day and formats local clock times', () => {
    // 19:30 UTC is 00:30 the next day in Karachi (UTC+5).
    const [item] = toHistoryItems(
      [session('2026-10-28T19:30:00Z', '2026-10-28T20:15:00Z')],
      'Asia/Karachi',
    );
    expect(item).toMatchObject({
      dateKey: '2026-10-29',
      startLabel: '00:30',
      endLabel: '01:15',
      durationMinutes: 45,
    });
  });

  it('leaves out the running session', () => {
    expect(toHistoryItems([session('2026-10-28T09:00:00Z', null)], 'UTC')).toEqual([]);
  });
});
