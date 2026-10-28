export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;
export const DAYS_PER_WEEK = 7;
export const DAYS_PER_TWO_WEEKS = 14;
export const MAX_WEEKS_IN_MONTH = 6;
// Weeks run Monday to Sunday, matching the existing time log sheets.
export const WEEK_STARTS_ON = 1;

export const MIN_ENTRY_MINUTES = 1;
export const MAX_ENTRY_MINUTES = HOURS_PER_DAY * MINUTES_PER_HOUR;
export const HOURS_DECIMAL_PLACES = 2;

export const MAX_NAME_LENGTH = 255;
export const MAX_TASK_LENGTH = 2000;
export const MAX_LINK_LENGTH = 2048;
export const MAX_IMPORT_ENTRIES = 200;
export const MAX_MONTHLY_LIMIT_HOURS = 744;

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 200;

export const SESSION_COOKIE = 'codeacme_tools_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;
export const TIME_ZONE_COOKIE = 'codeacme_tools_tz';
export const LAST_CLIENT_COOKIE = 'codeacme_tools_last_client';
export const LAST_CLIENT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;
export const TIME_ZONE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
export const DEFAULT_TIME_ZONE = 'UTC';

export const LOGIN_RATE_LIMIT = { requests: 5, windowSeconds: 60 } as const;

export const UNDO_TOAST_DURATION_MS = 6000;

export const MAX_ACCOUNT_PURPOSE_LENGTH = 1000;
export const MAX_ACCOUNT_NOTES_LENGTH = 5000;
export const MAX_SECRET_LENGTH = 10000;
export const MAX_IMPORT_ACCOUNTS = 200;
export const ACCOUNT_ACTIVITY_PAGE_SIZE = 200;
export const SECRET_VISIBLE_MS = 30_000;

export const MAX_SESSION_NOTE_LENGTH = 500;
export const WORK_TIMER_HISTORY_DAYS = 62;
// Running longer than this usually means someone forgot to press stop.
export const LONG_SESSION_WARNING_MINUTES = 10 * 60;
