import { describe, expect, it } from 'vitest';
import {
  elapsedMs,
  finishTimer,
  isPaused,
  parseLocalTimer,
  pauseTimer,
  resumeTimer,
  startTimer,
} from '@/lib/work-timer/local-timer';

const START = Date.UTC(2026, 9, 28, 9, 0, 0);
const MINUTE = 60_000;
const DETAILS = { clientId: 'client', label: 'The 30k Club', note: 'Kajabi setup' };

describe('local work timer', () => {
  it('counts from the moment Start is pressed', () => {
    const timer = startTimer(DETAILS, START);
    expect(elapsedMs(timer, START + 5 * MINUTE)).toBe(5 * MINUTE);
  });

  it('stops counting while paused and carries on after resume', () => {
    let timer = startTimer(DETAILS, START);
    timer = pauseTimer(timer, START + 10 * MINUTE);
    expect(isPaused(timer)).toBe(true);
    expect(elapsedMs(timer, START + 40 * MINUTE)).toBe(10 * MINUTE);

    timer = resumeTimer(timer, START + 40 * MINUTE);
    expect(elapsedMs(timer, START + 45 * MINUTE)).toBe(15 * MINUTE);
  });

  it('saves the worked time, excluding pauses, with the real start and stop moments', () => {
    let timer = startTimer(DETAILS, START);
    timer = pauseTimer(timer, START + 20 * MINUTE);
    timer = resumeTimer(timer, START + 50 * MINUTE);

    expect(finishTimer(timer, START + 60 * MINUTE)).toEqual({
      legacySessionId: null,
      clientId: 'client',
      note: 'Kajabi setup',
      startedAt: '2026-10-28T09:00:00.000Z',
      endedAt: '2026-10-28T10:00:00.000Z',
      workedSeconds: 30 * 60,
    });
  });

  it('ignores pause and resume when they do not apply', () => {
    const running = startTimer(DETAILS, START);
    expect(resumeTimer(running, START + MINUTE)).toBe(running);
    const paused = pauseTimer(running, START + MINUTE);
    expect(pauseTimer(paused, START + 2 * MINUTE)).toBe(paused);
  });

  it('round-trips through storage and rejects anything malformed', () => {
    const timer = startTimer(DETAILS, START);
    expect(parseLocalTimer(JSON.stringify(timer))).toEqual(timer);
    expect(parseLocalTimer('not json')).toBeNull();
    expect(parseLocalTimer(JSON.stringify({ startedAtMs: 'yesterday' }))).toBeNull();
    expect(parseLocalTimer(null)).toBeNull();
  });
});
