import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Plus, ReceiptText } from 'lucide-react';
import { PageHeader } from '@/components/platform/page-header';
import { RowListSkeleton } from '@/components/platform/skeletons';
import { InvoiceList } from '@/components/tools/projects/invoice-list';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { ToolId } from '@/config/tools';
import { ROUTES } from '@/lib/routes';
import { requireToolAccess } from '@/server/auth/guards';
import { listInvoices } from '@/server/services/projects/projects.service';

export const metadata: Metadata = { title: 'Invoices' };

async function InvoicesContent() {
  await requireToolAccess(ToolId.PROJECTS);
  const invoices = await listInvoices();
  return invoices.length === 0 ? (
    <Empty className="bg-card/60 rounded-2xl border border-dashed py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ReceiptText />
        </EmptyMedia>
        <EmptyTitle>No invoices yet</EmptyTitle>
        <EmptyDescription>
          Create one from a project, or start a blank invoice for any client.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  ) : (
    <InvoiceList invoices={invoices} />
  );
}

export default function InvoicesPage() {
  return (
    <>
      <PageHeader
        title="Invoices"
        description="Every invoice with its total and status. Download the PDF to send it."
        actions={
          <Button asChild>
            <Link href={ROUTES.TOOLS.PROJECTS.NEW_INVOICE}>
              <Plus />
              New invoice
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<RowListSkeleton />}>
        <InvoicesContent />
      </Suspense>
    </>
  );
}
