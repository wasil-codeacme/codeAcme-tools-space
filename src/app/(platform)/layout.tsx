import { type ReactNode, Suspense } from 'react';
import { AppSidebar, AppSidebarSkeleton } from '@/components/platform/app-sidebar';
import { PendingNavigationProvider } from '@/components/platform/pending-navigation';
import { PlatformHeader } from '@/components/platform/platform-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { requireUser } from '@/server/auth/guards';

async function SignedInSidebar() {
  const user = await requireUser();
  return <AppSidebar user={{ name: user.name, email: user.email, role: user.role }} />;
}

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <Suspense fallback={<AppSidebarSkeleton />}>
        <SignedInSidebar />
      </Suspense>
      <SidebarInset className="bg-ledger min-w-0">
        <PlatformHeader />
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 pt-2 pb-16 md:px-8">
          <PendingNavigationProvider>{children}</PendingNavigationProvider>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
