import type { MonthUsage } from '@/types/time-tracking';

export const UsageStatus = {
  NO_LIMIT: 'NO_LIMIT',
  WITHIN_LIMIT: 'WITHIN_LIMIT',
  NEAR_LIMIT: 'NEAR_LIMIT',
  LIMIT_REACHED: 'LIMIT_REACHED',
} as const;

export type UsageStatus = (typeof UsageStatus)[keyof typeof UsageStatus];

export const USAGE_STATUS_LABELS: Record<UsageStatus, string> = {
  NO_LIMIT: 'No limit',
  WITHIN_LIMIT: 'Within the limit',
  NEAR_LIMIT: 'Nearing the limit',
  LIMIT_REACHED: 'Limit reached',
};

// Warn a little before the cap so the client conversation happens before the hours run out.
const NEAR_LIMIT_RATIO = 0.8;

export function getUsageStatus(usedMinutes: number, limitMinutes: number | null): UsageStatus {
  if (limitMinutes === null) {
    return UsageStatus.NO_LIMIT;
  }
  if (usedMinutes >= limitMinutes) {
    return UsageStatus.LIMIT_REACHED;
  }
  return usedMinutes >= limitMinutes * NEAR_LIMIT_RATIO
    ? UsageStatus.NEAR_LIMIT
    : UsageStatus.WITHIN_LIMIT;
}

export function remainingMinutes(usedMinutes: number, limitMinutes: number | null): number | null {
  return limitMinutes === null ? null : Math.max(0, limitMinutes - usedMinutes);
}

export function usageRatio(usedMinutes: number, limitMinutes: number | null): number | null {
  return limitMinutes === null || limitMinutes === 0 ? null : usedMinutes / limitMinutes;
}

export function toMonthUsage(
  usedMinutes: number,
  limitMinutes: number | null,
  monthLabel: string,
): MonthUsage {
  return {
    monthLabel,
    usedMinutes,
    limitMinutes,
    remainingMinutes: remainingMinutes(usedMinutes, limitMinutes),
    status: getUsageStatus(usedMinutes, limitMinutes),
  };
}
