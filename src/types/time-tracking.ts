import type { DateKey } from '@/lib/time-tracking/date-key';
import type { UsageStatus } from '@/lib/time-tracking/usage';

export interface ClientSummary {
  id: string;
  name: string;
  slug: string;
  contactName: string | null;
  monthlyLimitMinutes: number | null;
  isArchived: boolean;
}

export interface CategoryOption {
  id: string;
  clientId: string;
  name: string;
  sortOrder: number;
  isArchived: boolean;
}

export interface TimeEntryView {
  id: string;
  clientId: string;
  userId: string;
  userName: string;
  categoryId: string | null;
  categoryName: string | null;
  dateKey: DateKey;
  durationMinutes: number;
  task: string;
  requestedBy: string | null;
  link: string | null;
  needsReview: boolean;
}

export interface MonthUsage {
  monthLabel: string;
  usedMinutes: number;
  limitMinutes: number | null;
  remainingMinutes: number | null;
  status: UsageStatus;
}

export interface ClientMemberView {
  userId: string;
  name: string;
  email: string;
}

export interface DayTotal {
  dateKey: DateKey;
  minutes: number;
}

export interface ClientWithUsage extends ClientSummary {
  usage: MonthUsage;
}

export interface LogView {
  weekStartKey: DateKey;
  weekEndKey: DateKey;
  entries: TimeEntryView[];
  monthUsage: MonthUsage;
}

export interface EntryWriteResult {
  entry: TimeEntryView;
  clientName: string;
  usage: MonthUsage;
}

export interface OverviewWeekCell {
  index: number;
  startKey: DateKey;
  endKey: DateKey;
  rangeLabel: string;
  minutes: number;
}

export interface OverviewMonthRow {
  monthKey: DateKey;
  label: string;
  weeks: OverviewWeekCell[];
  usage: MonthUsage;
}

export interface YearOverview {
  year: number;
  months: OverviewMonthRow[];
  totalMinutes: number;
}
