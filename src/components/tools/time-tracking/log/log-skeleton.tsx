import { Skeleton } from '@/components/ui/skeleton';
import { DAYS_PER_WEEK } from '@/lib/constants';

const ENTRY_SKELETON_ROWS = 4;

export function LogSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <Skeleton className="h-9 w-56 rounded-lg" />
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: DAYS_PER_WEEK }, (_, index) => (
          <Skeleton key={index} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-2">
          {Array.from({ length: ENTRY_SKELETON_ROWS }, (_, index) => (
            <Skeleton key={index} className="h-14 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-44 rounded-2xl" />
      </div>
    </div>
  );
}
