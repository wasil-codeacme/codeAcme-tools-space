import { describe, expect, it } from 'vitest';
import { formatDecimalHours, formatDuration } from '@/lib/time-tracking/duration';

describe('formatDuration', () => {
  it.each([
    [5, '5m'],
    [60, '1h'],
    [70, '1h 10m'],
    [125, '2h 5m'],
  ])('formats %i minutes as %s', (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });
});

describe('formatDecimalHours', () => {
  it('sums exact minutes without rounding to quarter hours', () => {
    // Week 4 of October in the old notes: 1h 10m + 35m + 15m.
    expect(formatDecimalHours(70 + 35 + 15)).toBe('2.00');
    expect(formatDecimalHours(5)).toBe('0.08');
  });
});
