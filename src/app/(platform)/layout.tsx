import { type ReactNode, Suspense, ViewTransition } from 'react';
import { AppSidebar, AppSidebarSkeleton } from '@/components/platform/app-sidebar';
import { HeaderTimerChip } from '@/components/platform/header-timer-chip';
import { TimerPopOutHost } from '@/components/platform/timer-pop-out';
import { MobileTabBar } from '@/components/platform/mobile-tab-bar';
import { NavigationProgress } from '@/components/platform/navigation-progress';
import { PendingNavigationProvider } from '@/components/platform/pending-navigation';
import { PlatformHeader } from '@/components/platform/platform-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ToolId, canUseTool } from '@/config/tools';
import { ToolAccessLevel } from '@/generated/prisma/enums';
import { requireUser } from '@/server/auth/guards';
import { listAccessibleClients } from '@/server/policies/client-access.policy';

async function SignedInSidebar() {
  const user = await requireUser();
  const clients = await listAccessibleClients(user);
  return (
    <>
      <AppSidebar
        user={{ name: user.name, email: user.email, role: user.role, toolAccess: user.toolAccess }}
        clients={clients.map(({ id, name }) => ({ id, name }))}
      />
      <MobileTabBar user={{ role: user.role, toolAccess: user.toolAccess }} />
    </>
  );
}

async function SignedInTimerChip() {
  const user = await requireUser();
  return canUseTool(user, ToolId.WORK_TIMER, ToolAccessLevel.EDIT) ? (
    <>
      <HeaderTimerChip userId={user.id} />
      <TimerPopOutHost userId={user.id} />
    </>
  ) : null;
}

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      {/* Reads the URL, which Cache Components only allows inside Suspense. */}
      <Suspense>
        <NavigationProgress />
      </Suspense>
      <Suspense fallback={<AppSidebarSkeleton />}>
        <SignedInSidebar />
      </Suspense>
      <SidebarInset className="bg-ledger min-w-0">
        <PlatformHeader
          trailing={
            <Suspense>
              <SignedInTimerChip />
            </Suspense>
          }
        />
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 pt-2 pb-28 md:px-8 md:pb-16">
          <PendingNavigationProvider>
            {/* Navigations cross-fade the page content; the sidebar and top bar stay put. */}
            <ViewTransition>{children}</ViewTransition>
          </PendingNavigationProvider>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
