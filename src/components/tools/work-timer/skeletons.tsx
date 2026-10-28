import { Skeleton } from '@/components/ui/skeleton';

const STAT_CARDS = 3;
const HISTORY_ROWS = 4;

export function TimerPanelSkeleton() {
  return <Skeleton className="h-[188px] rounded-3xl" />;
}

export function SessionHistorySkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: STAT_CARDS }, (_, index) => (
          <Skeleton key={index} className="h-[98px] rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-11 rounded-xl" />
      <div className="bg-card space-y-3 rounded-2xl border p-4">
        {Array.from({ length: HISTORY_ROWS }, (_, index) => (
          <Skeleton key={index} className="h-6 w-full" />
        ))}
      </div>
    </div>
  );
}
