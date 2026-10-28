import { MAX_ENTRY_MINUTES, MIN_ENTRY_MINUTES, MINUTES_PER_HOUR } from '@/lib/constants';

// Accepts the shapes people already write in their notes: "30", "30m", "30 mins", "1h", "1h 10m",
// "1h10", "1:10", "1.5h". A bare integer means minutes; a bare decimal means hours.

const HOUR_UNIT = '(?:hours?|hrs?|h)';
const MINUTE_UNIT = '(?:minutes?|mins?|m)';
const NOT_A_LETTER = '(?![a-z])';

// Shared with the notes parser to find a duration at the start or end of a line.
export const DURATION_TOKEN = [
  `\\d+(?:\\.\\d+)?\\s*${HOUR_UNIT}${NOT_A_LETTER}(?:\\s*\\d+\\s*(?:${MINUTE_UNIT}${NOT_A_LETTER})?)?`,
  `\\d+\\s*${MINUTE_UNIT}${NOT_A_LETTER}`,
  `\\d+:[0-5]\\d`,
].join('|');

const CLOCK_PATTERN = /^(\d+):([0-5]\d)$/;
const HOURS_PATTERN = new RegExp(
  `^(\\d+(?:\\.\\d+)?)\\s*${HOUR_UNIT}(?:\\s*(\\d+)\\s*(?:${MINUTE_UNIT})?)?$`,
);
const MINUTES_PATTERN = new RegExp(`^(\\d+)\\s*${MINUTE_UNIT}$`);
const BARE_INTEGER_PATTERN = /^\d+$/;
const BARE_DECIMAL_PATTERN = /^\d*\.\d+$/;

function withinBounds(minutes: number): number | null {
  if (!Number.isInteger(minutes) || minutes < MIN_ENTRY_MINUTES || minutes > MAX_ENTRY_MINUTES) {
    return null;
  }
  return minutes;
}

function parseHoursMatch(hoursText: string, minutesText: string | undefined): number | null {
  const hours = Number(hoursText);
  if (minutesText === undefined) {
    return Math.round(hours * MINUTES_PER_HOUR);
  }
  const minutes = Number(minutesText);
  if (!Number.isInteger(hours) || minutes >= MINUTES_PER_HOUR) {
    return null;
  }
  return hours * MINUTES_PER_HOUR + minutes;
}

function toMinutes(text: string): number | null {
  const clock = CLOCK_PATTERN.exec(text);
  if (clock) {
    return Number(clock[1]) * MINUTES_PER_HOUR + Number(clock[2]);
  }
  const hours = HOURS_PATTERN.exec(text);
  if (hours?.[1]) {
    return parseHoursMatch(hours[1], hours[2]);
  }
  const minutes = MINUTES_PATTERN.exec(text);
  if (minutes) {
    return Number(minutes[1]);
  }
  if (BARE_INTEGER_PATTERN.test(text)) {
    return Number(text);
  }
  if (BARE_DECIMAL_PATTERN.test(text)) {
    return Math.round(Number(text) * MINUTES_PER_HOUR);
  }
  return null;
}

export function parseDuration(input: string): number | null {
  const normalized = input.trim().toLowerCase().replace(/\s+/g, ' ');
  if (normalized === '') {
    return null;
  }
  const minutes = toMinutes(normalized);
  return minutes === null ? null : withinBounds(minutes);
}
