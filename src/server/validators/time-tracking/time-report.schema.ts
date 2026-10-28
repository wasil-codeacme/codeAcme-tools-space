import { z } from 'zod';
import { ReportPeriod } from '@/lib/time-tracking/report-period';
import { dateKeySchema, idSchema } from '@/server/validators/shared.schema';

export const ReportBranding = {
  CODEACME: 'codeacme',
  NONE: 'none',
} as const;

export type ReportBranding = (typeof ReportBranding)[keyof typeof ReportBranding];

export const ReportFormat = {
  PDF: 'pdf',
  CSV: 'csv',
} as const;

export type ReportFormat = (typeof ReportFormat)[keyof typeof ReportFormat];

export const reportQuerySchema = z.object({
  clientId: idSchema,
  period: z.enum([ReportPeriod.WEEK, ReportPeriod.TWO_WEEKS, ReportPeriod.MONTH]),
  date: dateKeySchema,
  branding: z.enum([ReportBranding.CODEACME, ReportBranding.NONE]).default(ReportBranding.CODEACME),
});

export const reportExportQuerySchema = reportQuerySchema.extend({
  format: z.enum([ReportFormat.PDF, ReportFormat.CSV]),
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;
export type ReportExportQuery = z.infer<typeof reportExportQuerySchema>;
