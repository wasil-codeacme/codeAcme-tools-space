import type { InvoiceStatus, ProjectStatus } from '@/generated/prisma/enums';
import type { DateKey } from '@/lib/time-tracking/date-key';

export interface ProjectView {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  actualMinutes: number | null;
  billedMinutes: number | null;
  invoiceCount: number;
}

export interface PaymentProfileView {
  id: string;
  label: string;
  details: string;
  paymentLink: string | null;
  isFavorite: boolean;
}

export interface InvoiceLineView {
  description: string;
  minutes: number;
  rateCents: number;
}

export interface InvoiceView {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  clientContactName: string | null;
  projectName: string | null;
  issueDate: DateKey;
  dueDate: DateKey;
  currency: string;
  paymentDetails: string;
  paymentLink: string | null;
  terms: string | null;
  notes: string | null;
  status: InvoiceStatus;
  lines: InvoiceLineView[];
  totalCents: number;
}
