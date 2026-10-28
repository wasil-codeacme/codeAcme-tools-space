import { Skeleton } from '@/components/ui/skeleton';
import { DAYS_PER_WEEK } from '@/lib/constants';

const ENTRY_ROWS = 4;
const OVERVIEW_MONTHS = 12;
const REPORT_STATS = 4;
const REPORT_DAYS = 3;
const CLIENT_CARDS = 2;

export function WeekStripSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
      {Array.from({ length: DAYS_PER_WEEK }, (_, index) => (
        <Skeleton key={index} className="h-[86px] rounded-xl" />
      ))}
    </div>
  );
}

export function DayPanelSkeleton() {
  return (
    <div className="bg-card min-h-80 space-y-3 rounded-2xl border p-5">
      <Skeleton className="h-6 w-56" />
      {Array.from({ length: ENTRY_ROWS }, (_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-6 w-14 rounded-md" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
      <Skeleton className="mt-4 h-12 w-full rounded-xl" />
    </div>
  );
}

export function UsageMeterSkeleton() {
  return <Skeleton className="h-[150px] rounded-2xl" />;
}

export function OverviewGridSkeleton() {
  return (
    <div className="bg-card space-y-2 rounded-2xl border p-5">
      <Skeleton className="mb-4 h-6 w-64" />
      {Array.from({ length: OVERVIEW_MONTHS }, (_, index) => (
        <Skeleton key={index} className="h-11 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function ReportPreviewSkeleton() {
  return (
    <div className="bg-card mx-auto max-w-4xl space-y-6 rounded-2xl border p-6 sm:p-10">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-9 w-72" />
      <div className="grid gap-3 sm:grid-cols-4">
        {Array.from({ length: REPORT_STATS }, (_, index) => (
          <Skeleton key={index} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
      {Array.from({ length: REPORT_DAYS }, (_, index) => (
        <Skeleton key={index} className="h-28 rounded-xl" />
      ))}
    </div>
  );
}

export function ClientListSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: CLIENT_CARDS }, (_, index) => (
        <Skeleton key={index} className="h-40 rounded-2xl" />
      ))}
    </div>
  );
}

export function ControlsSkeleton() {
  return (
    <div className="flex flex-wrap justify-between gap-3">
      <Skeleton className="h-9 w-56 rounded-lg" />
      <Skeleton className="h-9 w-40 rounded-lg" />
    </div>
  );
}

export function WeekTitleSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-52" />
      <Skeleton className="h-7 w-60" />
    </div>
  );
}
