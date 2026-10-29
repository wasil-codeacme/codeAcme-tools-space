import { type ReactNode, Suspense } from 'react';
import { AppSidebar, AppSidebarSkeleton } from '@/components/platform/app-sidebar';
import { MobileTabBar } from '@/components/platform/mobile-tab-bar';
import { PendingNavigationProvider } from '@/components/platform/pending-navigation';
import { PlatformHeader } from '@/components/platform/platform-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { requireUser } from '@/server/auth/guards';

async function SignedInSidebar() {
  const user = await requireUser();
  return (
    <>
      <AppSidebar
        user={{ name: user.name, email: user.email, role: user.role, toolAccess: user.toolAccess }}
      />
      <MobileTabBar user={{ role: user.role, toolAccess: user.toolAccess }} />
    </>
  );
}

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <Suspense fallback={<AppSidebarSkeleton />}>
        <SignedInSidebar />
      </Suspense>
      <SidebarInset className="bg-ledger min-w-0">
        <PlatformHeader />
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 pt-2 pb-28 md:px-8 md:pb-16">
          <PendingNavigationProvider>{children}</PendingNavigationProvider>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
