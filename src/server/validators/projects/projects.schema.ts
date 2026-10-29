import { z } from 'zod';
import { InvoiceStatus, ProjectStatus } from '@/generated/prisma/enums';
import { MAX_LINK_LENGTH, MAX_NAME_LENGTH, MAX_TASK_LENGTH } from '@/lib/constants';
import { dateKeySchema, idSchema, optionalTextSchema } from '@/server/validators/shared.schema';

const MAX_PROJECT_HOURS = 10_000;
const MAX_HOURLY_RATE = 10_000;
const MAX_INVOICE_LINES = 50;
const MAX_LINE_DESCRIPTION = 500;
const MAX_LONG_TEXT = 5000;

// Hours as typed (e.g. 20 or 1.5); the service stores exact minutes. No transform here, because the
// form's resolver would apply it in the browser and the server would convert a second time.
const optionalHoursSchema = z.number().min(0).max(MAX_PROJECT_HOURS).nullable();

export const projectFieldsSchema = z.object({
  clientId: idSchema,
  name: z.string().trim().min(1, 'Name the project.').max(MAX_NAME_LENGTH),
  description: optionalTextSchema(MAX_TASK_LENGTH),
  status: z.enum([ProjectStatus.ACTIVE, ProjectStatus.COMPLETED]).default(ProjectStatus.ACTIVE),
  actualHours: optionalHoursSchema,
  billedHours: optionalHoursSchema,
});

export const updateProjectSchema = projectFieldsSchema.extend({ projectId: idSchema });

export const paymentProfileFieldsSchema = z.object({
  label: z.string().trim().min(1, 'Give it a name, e.g. "Wise USD".').max(MAX_NAME_LENGTH),
  details: z.string().trim().min(1, 'Add the account or bank details.').max(MAX_LONG_TEXT),
  paymentLink: z.url('Enter a full link, starting with https://').max(MAX_LINK_LENGTH).nullish(),
  isFavorite: z.boolean().default(false),
});

export const updatePaymentProfileSchema = paymentProfileFieldsSchema.extend({
  paymentProfileId: idSchema,
});

const invoiceLineSchema = z.object({
  description: z.string().trim().min(1, 'Describe the work.').max(MAX_LINE_DESCRIPTION),
  hours: z.number().positive('Enter the hours.').max(MAX_PROJECT_HOURS),
  rate: z.number().min(0).max(MAX_HOURLY_RATE),
});

export const createInvoiceSchema = z
  .object({
    clientId: idSchema,
    projectId: idSchema.nullish().transform((value) => value ?? null),
    issueDate: dateKeySchema,
    dueDate: dateKeySchema,
    paymentProfileId: idSchema,
    terms: optionalTextSchema(MAX_LONG_TEXT),
    notes: optionalTextSchema(MAX_LONG_TEXT),
    lines: z.array(invoiceLineSchema).min(1, 'Add at least one line.').max(MAX_INVOICE_LINES),
  })
  .refine((invoice) => invoice.dueDate >= invoice.issueDate, {
    message: 'The due date cannot be before the issue date.',
    path: ['dueDate'],
  });

export const setInvoiceStatusSchema = z.object({
  invoiceId: idSchema,
  status: z.enum([InvoiceStatus.DRAFT, InvoiceStatus.SENT, InvoiceStatus.PAID]),
});

export const idOnlySchema = z.object({ id: idSchema });

export type ProjectFieldsInput = z.output<typeof projectFieldsSchema>;
export type ProjectFieldsForm = z.input<typeof projectFieldsSchema>;
export type UpdateProjectInput = z.output<typeof updateProjectSchema>;
export type PaymentProfileFieldsInput = z.output<typeof paymentProfileFieldsSchema>;
export type PaymentProfileForm = z.input<typeof paymentProfileFieldsSchema>;
export type UpdatePaymentProfileInput = z.output<typeof updatePaymentProfileSchema>;
export type CreateInvoiceInput = z.output<typeof createInvoiceSchema>;
export type CreateInvoiceForm = z.input<typeof createInvoiceSchema>;
export type SetInvoiceStatusInput = z.output<typeof setInvoiceStatusSchema>;
