import { Badge } from '@/components/ui/badge';
import { USAGE_STATUS_LABELS, type UsageStatus } from '@/lib/time-tracking/usage';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<UsageStatus, string> = {
  NO_LIMIT: 'bg-muted text-muted-foreground',
  WITHIN_LIMIT: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
  NEAR_LIMIT: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  LIMIT_REACHED: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
};

export function UsageStatusBadge({ status }: { status: UsageStatus }) {
  return (
    <Badge className={cn('font-medium', STATUS_STYLES[status])}>
      {USAGE_STATUS_LABELS[status]}
    </Badge>
  );
}
