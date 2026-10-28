import { describe, expect, it } from 'vitest';
import { parseDuration } from '@/lib/time-tracking/parse-duration';

describe('parseDuration', () => {
  it.each([
    ['30', 30],
    ['30m', 30],
    ['30 m', 30],
    ['30 mins', 30],
    ['5 min', 5],
    ['45 minutes', 45],
    ['1h', 60],
    ['2 hours', 120],
    ['1 hr', 60],
    ['1h 10m', 70],
    ['1h10', 70],
    ['1h10m', 70],
    ['1 h 10 m', 70],
    ['1:10', 70],
    ['0:45', 45],
    ['1.5h', 90],
    ['1.5', 90],
    ['.25', 15],
    ['  1H 45M  ', 105],
  ])('reads %j as %i minutes', (input, expected) => {
    expect(parseDuration(input)).toBe(expected);
  });

  it.each(['', 'abc', '0', '0m', '1.5h 10m', '1:75', '25h', '-5', '10 apples'])(
    'rejects %j',
    (input) => {
      expect(parseDuration(input)).toBeNull();
    },
  );
});
