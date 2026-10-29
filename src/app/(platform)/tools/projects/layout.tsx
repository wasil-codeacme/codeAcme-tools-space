import { type ReactNode, Suspense } from 'react';
import { ToolTabs } from '@/components/platform/tool-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ToolId } from '@/config/tools';
import { Role } from '@/generated/prisma/enums';
import { requireToolAccess } from '@/server/auth/guards';

async function ProjectsTabs() {
  const user = await requireToolAccess(ToolId.PROJECTS);
  return <ToolTabs toolId={ToolId.PROJECTS} isAdmin={user.role === Role.ADMIN} />;
}

export default function ProjectsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={<Skeleton className="mt-4 h-10 w-full rounded-xl" />}>
        <ProjectsTabs />
      </Suspense>
      <div className="pt-6">{children}</div>
    </>
  );
}
