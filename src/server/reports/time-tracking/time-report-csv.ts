import { formatDateKey } from '@/lib/time-tracking/date-key';
import { formatDecimalHours } from '@/lib/time-tracking/duration';
import type { TimeReport } from '@/types/time-report';

const BYTE_ORDER_MARK = '﻿';
const LINE_BREAK = '\r\n';
const HEADERS = [
  'Date',
  'Day',
  'Minutes',
  'Hours',
  'Task',
  'Category',
  'Team member',
  'Requested by',
  'Link',
  'Needs review',
];

// Spreadsheet apps execute cells that start with these characters as formulas.
const FORMULA_TRIGGERS = /^[=+\-@\t\r]/;

export function escapeCsvCell(value: string | number | boolean | null): string {
  if (value === null) {
    return '';
  }
  const text = String(value);
  const safe = FORMULA_TRIGGERS.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

// One row per entry; Excel opens it correctly thanks to the BOM and CRLF line endings.
export function renderTimeReportCsv(report: TimeReport): string {
  const rows = report.days.flatMap((day) =>
    day.entries.map((entry) => [
      day.dateKey,
      formatDateKey(day.dateKey, 'EEE'),
      entry.durationMinutes,
      formatDecimalHours(entry.durationMinutes),
      entry.task,
      entry.categoryName,
      entry.userName,
      entry.requestedBy,
      entry.link,
      entry.needsReview ? 'yes' : 'no',
    ]),
  );
  const lines = [HEADERS, ...rows].map((row) => row.map(escapeCsvCell).join(','));
  return BYTE_ORDER_MARK + lines.join(LINE_BREAK) + LINE_BREAK;
}
