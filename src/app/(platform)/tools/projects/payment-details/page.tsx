import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Landmark } from 'lucide-react';
import { PageHeader } from '@/components/platform/page-header';
import { ListPageSkeleton } from '@/components/platform/skeletons';
import { PaymentProfileDialog } from '@/components/tools/projects/payment-profile-dialog';
import { PaymentProfileList } from '@/components/tools/projects/payment-profile-list';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { requireAdmin } from '@/server/auth/guards';
import { listPaymentProfiles } from '@/server/services/projects/projects.service';

export const metadata: Metadata = { title: 'Payment details' };

async function PaymentDetailsContent() {
  await requireAdmin();
  const profiles = await listPaymentProfiles();
  return profiles.length === 0 ? (
    <Empty className="bg-card/60 rounded-2xl border border-dashed py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Landmark />
        </EmptyMedia>
        <EmptyTitle>No payment details yet</EmptyTitle>
        <EmptyDescription>
          Add how clients pay you, such as your Wise or bank details, to use them on invoices.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  ) : (
    <PaymentProfileList profiles={profiles} />
  );
}

export default function PaymentDetailsPage() {
  return (
    <>
      <PageHeader
        title="Payment details"
        description="Saved ways to get paid. Mark one as a favourite to offer it first on new invoices."
        actions={<PaymentProfileDialog />}
      />
      <Suspense fallback={<ListPageSkeleton />}>
        <PaymentDetailsContent />
      </Suspense>
    </>
  );
}
