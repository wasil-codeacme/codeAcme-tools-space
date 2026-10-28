import { describe, expect, it } from 'vitest';
import { UsageStatus, getUsageStatus, remainingMinutes } from '@/lib/time-tracking/usage';

const TWENTY_HOURS = 20 * 60;

describe('retainer usage', () => {
  it.each([
    [0, null, UsageStatus.NO_LIMIT],
    [600, TWENTY_HOURS, UsageStatus.WITHIN_LIMIT],
    [960, TWENTY_HOURS, UsageStatus.NEAR_LIMIT],
    [TWENTY_HOURS, TWENTY_HOURS, UsageStatus.LIMIT_REACHED],
    [TWENTY_HOURS + 30, TWENTY_HOURS, UsageStatus.LIMIT_REACHED],
  ])('%i minutes against a %s minute cap is %s', (used, limit, expected) => {
    expect(getUsageStatus(used, limit)).toBe(expected);
  });

  it('never reports negative remaining time', () => {
    expect(remainingMinutes(TWENTY_HOURS + 30, TWENTY_HOURS)).toBe(0);
    expect(remainingMinutes(240, TWENTY_HOURS)).toBe(960);
    expect(remainingMinutes(240, null)).toBeNull();
  });
});
