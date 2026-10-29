import type { InvoiceStatus, ProjectStatus } from '@/generated/prisma/enums';

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  ACTIVE: 'In progress',
  COMPLETED: 'Completed',
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  PAID: 'Paid',
};
