import { MAX_TASK_LENGTH } from '@/lib/constants';
import { type DateKey, fromDateKey, isDateKey } from '@/lib/time-tracking/date-key';
import { DURATION_TOKEN, parseDuration } from '@/lib/time-tracking/parse-duration';

// Turns free-form day notes into entries. Understands the style already in use:
//   Week 4 oct 19 to 25 time : 2h            -> week heading (ignored)
//   time spent on 21st october : 1h 10m      -> day heading: following items land on Oct 21
//   30 mins meet                              -> 30m "meet"
//   Meeting with Anna 1h                      -> 60m "Meeting with Anna"
//   Setting Bitwarden 15 m ??                 -> 15m, flagged "needs review"
// Lines with no recognisable duration are reported back so nothing is silently dropped.

export interface ParsedNoteEntry {
  lineNumber: number;
  dateKey: DateKey;
  durationMinutes: number;
  task: string;
  needsReview: boolean;
}

export interface SkippedNoteLine {
  lineNumber: number;
  text: string;
}

export interface ParsedNotes {
  entries: ParsedNoteEntry[];
  skipped: SkippedNoteLine[];
}

const MONTH_NAMES = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const;
const MONTH_ABBREVIATION_LENGTH = 3;

const BULLET_PATTERN = /^[-*•·]\s+/;
const REVIEW_MARK_PATTERN = /\s*\?{2,}\s*$/;
const WEEK_HEADING_PATTERN = /^week\s*\d+/i;
const TIME_SPENT_PATTERN = /^time\s+spent\b/i;
const DAY_HEADING_PATTERN =
  /^(?:time\s+spent\s+(?:on\s+)?)?(?:[a-z]{3,9},?\s+)?(\d{1,2})\s*(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]{3,9})\b/i;
const LEADING_DURATION = new RegExp(`^(${DURATION_TOKEN})\\s*[-–:,.]?\\s+(.+)$`, 'i');
const TRAILING_DURATION = new RegExp(`^(.+?)\\s*[-–:,]?\\s*(${DURATION_TOKEN})$`, 'i');

function cleanTask(task: string): string {
  return task
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–:,.]+|[\s\-–:,]+$/g, '')
    .slice(0, MAX_TASK_LENGTH);
}

function headingDate(line: string, year: string): DateKey | null {
  const match = DAY_HEADING_PATTERN.exec(line);
  if (!match?.[1] || !match[2]) {
    return null;
  }
  const word = match[2].toLowerCase();
  // Exact names or 3-letter abbreviations only, so "15 decorations" is not read as 15 December.
  const monthIndex = MONTH_NAMES.findIndex(
    (name) => word === name || word === name.slice(0, MONTH_ABBREVIATION_LENGTH),
  );
  if (monthIndex === -1) {
    return null;
  }
  const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  return isDateKey(key) ? key : null;
}

function splitDuration(line: string): { minutes: number; task: string } | null {
  const leading = LEADING_DURATION.exec(line);
  const trailing = leading ? null : TRAILING_DURATION.exec(line);
  const durationText = leading?.[1] ?? trailing?.[2];
  const taskText = leading?.[2] ?? trailing?.[1];
  if (!durationText || !taskText) {
    return null;
  }
  const minutes = parseDuration(durationText);
  const task = cleanTask(taskText);
  return minutes === null || task === '' ? null : { minutes, task };
}

export function parseNotes(text: string, defaultDateKey: DateKey): ParsedNotes {
  const year = String(fromDateKey(defaultDateKey).getFullYear());
  const result: ParsedNotes = { entries: [], skipped: [] };
  let currentDate = defaultDateKey;

  text.split(/\r?\n/).forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = rawLine.trim().replace(BULLET_PATTERN, '');
    if (line === '' || WEEK_HEADING_PATTERN.test(line)) {
      return;
    }

    const dayHeading = headingDate(line, year);
    if (dayHeading || TIME_SPENT_PATTERN.test(line)) {
      currentDate = dayHeading ?? currentDate;
      return;
    }

    const needsReview = REVIEW_MARK_PATTERN.test(line);
    const parsed = splitDuration(line.replace(REVIEW_MARK_PATTERN, ''));
    if (!parsed) {
      result.skipped.push({ lineNumber, text: line });
      return;
    }
    result.entries.push({
      lineNumber,
      dateKey: currentDate,
      durationMinutes: parsed.minutes,
      task: parsed.task,
      needsReview,
    });
  });

  return result;
}
