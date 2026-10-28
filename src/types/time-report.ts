import type { DateKey } from '@/lib/time-tracking/date-key';
import type { ResolvedPeriod } from '@/lib/time-tracking/report-period';
import type { MonthUsage } from '@/types/time-tracking';

export const BreakdownKind = {
  WEEK: 'WEEK',
  DAY: 'DAY',
} as const;

export type BreakdownKind = (typeof BreakdownKind)[keyof typeof BreakdownKind];

export interface ReportShareRow {
  label: string;
  minutes: number;
  share: number;
}

export interface ReportBreakdownRow {
  label: string;
  detail: string;
  minutes: number;
}

export interface ReportEntry {
  durationMinutes: number;
  task: string;
  categoryName: string | null;
  requestedBy: string | null;
  link: string | null;
  needsReview: boolean;
  userName: string;
}

export interface ReportDay {
  dateKey: DateKey;
  label: string;
  totalMinutes: number;
  entries: ReportEntry[];
}

export interface TimeReport {
  client: { name: string; slug: string; contactName: string | null };
  period: ResolvedPeriod;
  generatedOn: DateKey;
  totalMinutes: number;
  entryCount: number;
  needsReviewCount: number;
  usage: MonthUsage | null;
  breakdownKind: BreakdownKind;
  breakdown: ReportBreakdownRow[];
  byCategory: ReportShareRow[];
  byMember: ReportShareRow[];
  days: ReportDay[];
}
