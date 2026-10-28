import {
  ControlsSkeleton,
  DayPanelSkeleton,
  UsageMeterSkeleton,
  WeekStripSkeleton,
} from '@/components/tools/time-tracking/skeletons';
import { Skeleton } from '@/components/ui/skeleton';

export function LogSkeleton() {
  return (
    <div className="space-y-5">
      <ControlsSkeleton />
      <div className="bg-card space-y-4 rounded-2xl border p-4 sm:p-5">
        <Skeleton className="h-14 w-72" />
        <WeekStripSkeleton />
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_290px]">
        <DayPanelSkeleton />
        <UsageMeterSkeleton />
      </div>
    </div>
  );
}
