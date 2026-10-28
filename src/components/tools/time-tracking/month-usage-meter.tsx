import { Gauge } from 'lucide-react';
import { UsageStatusBadge } from '@/components/tools/time-tracking/usage-status-badge';
import { formatDecimalHours, formatDuration } from '@/lib/time-tracking/duration';
import { UsageStatus, usageRatio } from '@/lib/time-tracking/usage';
import { cn } from '@/lib/utils';
import type { MonthUsage } from '@/types/time-tracking';

const FULL_PERCENT = 100;

const BAR_COLOR: Record<UsageStatus, string> = {
  NO_LIMIT: 'bg-primary',
  WITHIN_LIMIT: 'bg-emerald-500',
  NEAR_LIMIT: 'bg-amber-500',
  LIMIT_REACHED: 'bg-rose-500',
};

export function MonthUsageMeter({
  usage,
  compact = false,
}: {
  usage: MonthUsage;
  compact?: boolean;
}) {
  const ratio = usageRatio(usage.usedMinutes, usage.limitMinutes);
  const percent = ratio === null ? 0 : Math.min(FULL_PERCENT, ratio * FULL_PERCENT);

  return (
    <div className={cn('space-y-3', !compact && 'bg-card rounded-2xl border p-5')}>
      {!compact && (
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Gauge className="text-muted-foreground size-4" />
            {usage.monthLabel}
          </p>
          <UsageStatusBadge status={usage.status} />
        </div>
      )}
      <div className="flex items-baseline gap-1.5">
        <span className="font-figures text-3xl font-medium tracking-tight">
          {formatDecimalHours(usage.usedMinutes)}
        </span>
        <span className="font-figures text-muted-foreground text-sm">
          {usage.limitMinutes === null
            ? 'h this month'
            : `/ ${formatDecimalHours(usage.limitMinutes)} h`}
        </span>
      </div>
      {usage.limitMinutes !== null && (
        <>
          <div
            role="progressbar"
            aria-valuenow={Math.round(percent)}
            aria-valuemin={0}
            aria-valuemax={FULL_PERCENT}
            aria-label="Monthly limit used"
            className="bg-muted h-2 overflow-hidden rounded-full"
          >
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-700 ease-(--ease-out-quint)',
                BAR_COLOR[usage.status],
              )}
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            {usage.status === UsageStatus.LIMIT_REACHED
              ? 'Limit reached. Let the client know before doing more work.'
              : `${formatDuration(usage.remainingMinutes ?? 0)} remaining this month`}
          </p>
        </>
      )}
    </div>
  );
}
