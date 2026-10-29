import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/platform/page-header';
import { TimerDirections } from '@/components/tools/work-timer/timer-directions';
import { requireAdmin } from '@/server/auth/guards';

export const metadata: Metadata = { title: 'Timer directions' };

async function AdminOnly({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}

// Temporary: three looks for the Work Timer to pick from. Delete after the choice is made.
export default function TimerDirectionsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Design preview"
        title="Pick the Work Timer's new look"
        description="Sample data with a live clock. Try Pause on each, then tell me A, B or C."
      />
      <Suspense>
        <AdminOnly>
          <TimerDirections />
        </AdminOnly>
      </Suspense>
    </>
  );
}
