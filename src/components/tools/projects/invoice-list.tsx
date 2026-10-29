'use client';

import { useTransition } from 'react';
import { Eye, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InvoiceStatus } from '@/generated/prisma/enums';
import { reportActionError } from '@/lib/action-feedback';
import { MESSAGES } from '@/lib/messages';
import { formatMoney } from '@/lib/projects/invoice-math';
import { INVOICE_STATUS_LABELS } from '@/lib/projects/labels';
import { ROUTES } from '@/lib/routes';
import { formatDateKey } from '@/lib/time-tracking/date-key';
import { cn } from '@/lib/utils';
import { setInvoiceStatus } from '@/server/actions/projects/projects.actions';
import type { InvoiceView } from '@/types/projects';

const STATUS_TONES: Record<InvoiceStatus, string> = {
  DRAFT: 'text-muted-foreground',
  SENT: 'text-primary',
  PAID: 'text-emerald-700',
};

function isInvoiceStatus(value: string): value is InvoiceStatus {
  return (Object.values(InvoiceStatus) as string[]).includes(value);
}

function InvoiceRow({ invoice, canEdit }: { invoice: InvoiceView; canEdit: boolean }) {
  const [isPending, startTransition] = useTransition();

  function changeStatus(status: InvoiceStatus) {
    startTransition(async () => {
      const result = await setInvoiceStatus({ invoiceId: invoice.id, status });
      if (result.error !== undefined) {
        reportActionError(result.error);
        return;
      }
      toast.success(MESSAGES.INVOICE.STATUS_SUCCESS);
    });
  }

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-figures text-sm font-medium">{invoice.number}</p>
        <p className="text-muted-foreground truncate text-xs">
          {invoice.clientName}
          {invoice.projectName ? ` · ${invoice.projectName}` : ''} · issued{' '}
          {formatDateKey(invoice.issueDate, 'd MMM yyyy')}
        </p>
      </div>
      <p className="font-figures text-sm font-semibold">
        {formatMoney(invoice.totalCents, invoice.currency)}
      </p>
      <Select
        value={invoice.status}
        onValueChange={(value) => isInvoiceStatus(value) && changeStatus(value)}
        disabled={isPending || !canEdit}
      >
        <SelectTrigger
          size="sm"
          className={cn('w-28', STATUS_TONES[invoice.status])}
          aria-label={`${invoice.number} status`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.values(InvoiceStatus).map((status) => (
            <SelectItem key={status} value={status}>
              {INVOICE_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="ghost" size="sm" asChild>
        <a
          href={`${ROUTES.API.PROJECTS.INVOICE_PDF(invoice.id)}?inline=1`}
          target="_blank"
          rel="noreferrer"
        >
          <Eye />
          View
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href={ROUTES.API.PROJECTS.INVOICE_PDF(invoice.id)} download>
          <FileDown />
          PDF
        </a>
      </Button>
    </li>
  );
}

export function InvoiceList({ invoices, canEdit }: { invoices: InvoiceView[]; canEdit: boolean }) {
  return (
    <ul className="ca-glow bg-card divide-y overflow-hidden rounded-2xl border">
      {invoices.map((invoice) => (
        <InvoiceRow key={invoice.id} invoice={invoice} canEdit={canEdit} />
      ))}
    </ul>
  );
}
