import { UTCDate } from '@date-fns/utc';
import { TZDate } from '@date-fns/tz';
import { addDays, endOfMonth, format, startOfMonth, startOfWeek } from 'date-fns';
import { WEEK_STARTS_ON } from '@/lib/constants';

// Work dates are calendar days with no time of day. They travel as `yyyy-MM-dd` keys and all math
// runs on UTCDate, so a Postgres DATE never shifts by a day in whatever timezone the server runs.

export type DateKey = string;

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_KEY_FORMAT = 'yyyy-MM-dd';

export function fromDateKey(key: DateKey): UTCDate {
  const [year, month, day] = key.split('-').map(Number);
  return new UTCDate(year ?? 0, (month ?? 1) - 1, day ?? 1);
}

export function toDateKey(date: Date): DateKey {
  return format(new UTCDate(date), DATE_KEY_FORMAT);
}

export function isDateKey(value: string): boolean {
  if (!DATE_KEY_PATTERN.test(value)) {
    return false;
  }
  return toDateKey(fromDateKey(value)) === value;
}

export function todayKey(timeZone: string, now: Date = new Date()): DateKey {
  return format(new TZDate(now, timeZone), DATE_KEY_FORMAT);
}

export function addDaysToKey(key: DateKey, days: number): DateKey {
  return toDateKey(addDays(fromDateKey(key), days));
}

export function weekStartKey(key: DateKey): DateKey {
  return toDateKey(startOfWeek(fromDateKey(key), { weekStartsOn: WEEK_STARTS_ON }));
}

export function monthStartKey(key: DateKey): DateKey {
  return toDateKey(startOfMonth(fromDateKey(key)));
}

export function monthEndKey(key: DateKey): DateKey {
  return toDateKey(endOfMonth(fromDateKey(key)));
}

export function formatDateKey(key: DateKey, pattern: string): string {
  return format(fromDateKey(key), pattern);
}

export function daysBetweenKeys(startKey: DateKey, endKey: DateKey): DateKey[] {
  const days: DateKey[] = [];
  for (let current = startKey; current <= endKey; current = addDaysToKey(current, 1)) {
    days.push(current);
  }
  return days;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function currentHour(timeZone: string, now: Date = new Date()): number {
  return new TZDate(now, timeZone).getHours();
}
