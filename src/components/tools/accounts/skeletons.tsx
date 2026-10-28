import { Skeleton } from '@/components/ui/skeleton';

const ACCOUNT_ROWS = 6;

export function AccountListSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <div className="bg-card divide-y rounded-2xl border">
        {Array.from({ length: ACCOUNT_ROWS }, (_, index) => (
          <div key={index} className="flex items-center gap-3 px-4 py-3.5">
            <Skeleton className="size-9 rounded-xl" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="ml-auto h-4 w-48" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AccountsToolbarSkeleton() {
  return (
    <div className="flex flex-wrap justify-between gap-3">
      <div className="flex gap-2">
        <Skeleton className="h-9 w-52 rounded-lg" />
        <Skeleton className="h-9 w-64 rounded-lg" />
      </div>
      <Skeleton className="h-9 w-64 rounded-lg" />
    </div>
  );
}
