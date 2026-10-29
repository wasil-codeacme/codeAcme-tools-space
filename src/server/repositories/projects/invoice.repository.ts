import type { InvoiceStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { formatInvoiceNumber, invoiceTotalCents } from '@/lib/projects/invoice-math';
import { fromDateKey, toDateKey, type DateKey } from '@/lib/time-tracking/date-key';
import type { InvoiceView } from '@/types/projects';

const INVOICE_INCLUDE = {
  client: { select: { name: true, contactName: true } },
  project: { select: { name: true } },
  lines: {
    select: { description: true, minutes: true, rateCents: true },
    orderBy: { sortOrder: 'asc' },
  },
} as const;

interface InvoiceRow {
  id: string;
  number: string;
  clientId: string;
  issueDate: Date;
  dueDate: Date;
  currency: string;
  paymentDetails: string;
  paymentLink: string | null;
  terms: string | null;
  notes: string | null;
  status: InvoiceStatus;
  client: { name: string; contactName: string | null };
  project: { name: string } | null;
  lines: { description: string; minutes: number; rateCents: number }[];
}

function toView(row: InvoiceRow): InvoiceView {
  return {
    id: row.id,
    number: row.number,
    clientId: row.clientId,
    clientName: row.client.name,
    clientContactName: row.client.contactName,
    projectName: row.project?.name ?? null,
    issueDate: toDateKey(row.issueDate),
    dueDate: toDateKey(row.dueDate),
    currency: row.currency,
    paymentDetails: row.paymentDetails,
    paymentLink: row.paymentLink,
    terms: row.terms,
    notes: row.notes,
    status: row.status,
    lines: row.lines,
    totalCents: invoiceTotalCents(row.lines),
  };
}

export interface NewInvoice {
  clientId: string;
  projectId: string | null;
  issueDate: DateKey;
  dueDate: DateKey;
  currency: string;
  paymentDetails: string;
  paymentLink: string | null;
  terms: string | null;
  notes: string | null;
  lines: { description: string; minutes: number; rateCents: number }[];
}

export const invoiceRepository = {
  async list(): Promise<InvoiceView[]> {
    const rows = await prisma.invoice.findMany({
      include: INVOICE_INCLUDE,
      orderBy: [{ issueDate: 'desc' }, { number: 'desc' }],
    });
    return rows.map(toView);
  },

  async findById(id: string): Promise<InvoiceView | null> {
    const row = await prisma.invoice.findUnique({ where: { id }, include: INVOICE_INCLUDE });
    return row ? toView(row) : null;
  },

  // The year's counter is bumped with an atomic upsert in the same transaction as the insert, so
  // two invoices created at once can never get the same number.
  async create({ lines, issueDate, dueDate, ...fields }: NewInvoice): Promise<InvoiceView> {
    const year = Number(issueDate.slice(0, 4));
    const row = await prisma.$transaction(async (tx) => {
      const sequence = await tx.invoiceSequence.upsert({
        where: { year },
        create: { year, lastNumber: 1 },
        update: { lastNumber: { increment: 1 } },
      });
      return tx.invoice.create({
        data: {
          ...fields,
          number: formatInvoiceNumber(year, sequence.lastNumber),
          issueDate: fromDateKey(issueDate),
          dueDate: fromDateKey(dueDate),
          lines: { create: lines.map((line, index) => ({ ...line, sortOrder: index })) },
        },
        include: INVOICE_INCLUDE,
      });
    });
    return toView(row);
  },

  async setStatus(id: string, status: InvoiceStatus): Promise<InvoiceView> {
    return toView(
      await prisma.invoice.update({ where: { id }, data: { status }, include: INVOICE_INCLUDE }),
    );
  },
};
