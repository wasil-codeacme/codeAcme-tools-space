import { type ReactNode, Suspense } from 'react';
import { ToolTabs } from '@/components/platform/tool-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ToolId } from '@/config/tools';
import { Role } from '@/generated/prisma/enums';
import { requireToolAccess } from '@/server/auth/guards';

async function WorkTimerTabs() {
  const user = await requireToolAccess(ToolId.WORK_TIMER);
  return <ToolTabs toolId={ToolId.WORK_TIMER} isAdmin={user.role === Role.ADMIN} />;
}

export default function WorkTimerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={<Skeleton className="mt-4 h-10 w-full rounded-xl" />}>
        <WorkTimerTabs />
      </Suspense>
      <div className="pt-6">{children}</div>
    </>
  );
}
