import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { PageHeader } from '@/components/platform/page-header';
import { ListPageSkeleton } from '@/components/platform/skeletons';
import { InvoiceForm } from '@/components/tools/projects/invoice-form';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';
import { addDaysToKey } from '@/lib/time-tracking/date-key';
import { requireAdmin } from '@/server/auth/guards';
import { listAccessibleClients } from '@/server/policies/client-access.policy';
import { listPaymentProfiles, listProjects } from '@/server/services/projects/projects.service';
import { getTodayKey } from '@/server/time-zone';

export const metadata: Metadata = { title: 'New invoice' };

const DEFAULT_PAYMENT_DAYS = 14;

async function NewInvoiceContent({ searchParams }: PageProps<'/tools/projects/invoices/new'>) {
  const actor = await requireAdmin();
  const [params, today, clients, projects, profiles] = await Promise.all([
    searchParams,
    getTodayKey(),
    listAccessibleClients(actor, { includeArchived: true }),
    listProjects(actor),
    listPaymentProfiles(),
  ]);

  if (profiles.length === 0) {
    return (
      <div className="bg-card/60 space-y-3 rounded-2xl border border-dashed p-10 text-center">
        <p className="font-medium">Add your payment details first</p>
        <p className="text-muted-foreground text-sm">
          Invoices tell the client how to pay, so save your Wise or bank details once.
        </p>
        <Button asChild>
          <Link href={ROUTES.TOOLS.PROJECTS.PAYMENT_DETAILS}>Add payment details</Link>
        </Button>
      </div>
    );
  }

  const projectId = typeof params.projectId === 'string' ? params.projectId : null;
  return (
    <InvoiceForm
      clients={clients.map(({ id, name }) => ({ id, name }))}
      projects={projects.map(({ id, clientId, name, billedMinutes }) => ({
        id,
        clientId,
        name,
        billedMinutes,
      }))}
      profiles={profiles}
      issueDate={today}
      dueDate={addDaysToKey(today, DEFAULT_PAYMENT_DAYS)}
      initialProjectId={projectId}
    />
  );
}

export default function NewInvoicePage(props: PageProps<'/tools/projects/invoices/new'>) {
  return (
    <>
      <PageHeader
        title="New invoice"
        description="Hours times your rate, with your saved payment details. Numbered automatically."
      />
      <Suspense fallback={<ListPageSkeleton />}>
        <NewInvoiceContent {...props} />
      </Suspense>
    </>
  );
}
