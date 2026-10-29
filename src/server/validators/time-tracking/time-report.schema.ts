import { z } from 'zod';
import { MAX_PREPARED_BY_LENGTH, MAX_REPORT_RANGE_DAYS } from '@/lib/constants';
import { daysBetweenKeys } from '@/lib/time-tracking/date-key';
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

const reportQueryFields = z.object({
  clientId: idSchema,
  period: z.enum([
    ReportPeriod.WEEK,
    ReportPeriod.TWO_WEEKS,
    ReportPeriod.MONTH,
    ReportPeriod.RANGE,
  ]),
  date: dateKeySchema,
  // End day of a custom range; ignored by the fixed periods.
  to: dateKeySchema.optional(),
  branding: z.enum([ReportBranding.CODEACME, ReportBranding.NONE]).default(ReportBranding.CODEACME),
});

function isValidRange(query: { period: ReportPeriod; date: string; to?: string }): boolean {
  if (query.period !== ReportPeriod.RANGE) {
    return true;
  }
  if (!query.to) {
    return false;
  }
  const [startKey, endKey] =
    query.date <= query.to ? [query.date, query.to] : [query.to, query.date];
  return daysBetweenKeys(startKey, endKey).length <= MAX_REPORT_RANGE_DAYS;
}

const RANGE_ERROR = {
  message: `Pick a start and end day no more than ${MAX_REPORT_RANGE_DAYS} days apart.`,
  path: ['to'],
};

export const reportQuerySchema = reportQueryFields.refine(isValidRange, RANGE_ERROR);

export const reportExportQuerySchema = reportQueryFields
  .extend({
    format: z.enum([ReportFormat.PDF, ReportFormat.CSV]),
    // The person named on the report, e.g. "Muhammad Ahmed Fraz"; defaults to nobody named.
    preparedBy: z.string().trim().max(MAX_PREPARED_BY_LENGTH).optional(),
  })
  .refine(isValidRange, RANGE_ERROR);

export type ReportQuery = z.infer<typeof reportQuerySchema>;
export type ReportExportQuery = z.infer<typeof reportExportQuerySchema>;
