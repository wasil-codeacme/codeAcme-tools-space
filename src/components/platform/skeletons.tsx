import { Skeleton } from '@/components/ui/skeleton';

const TOOL_SKELETON_CARDS = 3;
const LIST_SKELETON_ROWS = 5;

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-3 pt-6 pb-6">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-4 w-96 max-w-full" />
    </div>
  );
}

export function ToolGridSkeleton() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: TOOL_SKELETON_CARDS }, (_, index) => (
          <Skeleton key={index} className="h-48 rounded-2xl" />
        ))}
      </div>
    </>
  );
}

export function ListPageSkeleton() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="space-y-3">
        {Array.from({ length: LIST_SKELETON_ROWS }, (_, index) => (
          <Skeleton key={index} className="h-14 rounded-xl" />
        ))}
      </div>
    </>
  );
}

export function RowListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: LIST_SKELETON_ROWS }, (_, index) => (
        <Skeleton key={index} className="h-14 rounded-xl" />
      ))}
    </div>
  );
}
