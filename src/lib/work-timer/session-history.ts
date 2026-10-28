import { MIN_ENTRY_MINUTES } from '@/lib/constants';
import { todayKey } from '@/lib/time-tracking/date-key';
import type { WorkSessionHistoryItem, WorkSessionView } from '@/types/work-timer';

const MILLISECONDS_PER_MINUTE = 60_000;

export function sessionMinutes(startedAt: string | Date, endedAt: string | Date): number {
  return Math.max(
    0,
    Math.round(
      (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / MILLISECONDS_PER_MINUTE,
    ),
  );
}

// Time Tracking needs at least one minute; a few seconds of work still counts as one.
export function billableSessionMinutes(startedAt: string | Date, endedAt: string | Date): number {
  return Math.max(MIN_ENTRY_MINUTES, sessionMinutes(startedAt, endedAt));
}

// Dates and clock times are resolved in the viewer's zone, so a session started at 23:30 local time
// lands on the right day even though the server runs in UTC.
export function toHistoryItems(
  sessions: readonly WorkSessionView[],
  timeZone: string,
): WorkSessionHistoryItem[] {
  const clock = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone });
  return sessions
    .filter((session): session is WorkSessionView & { endedAt: string } => session.endedAt !== null)
    .map((session) => ({
      ...session,
      dateKey: todayKey(timeZone, new Date(session.startedAt)),
      startLabel: clock.format(new Date(session.startedAt)),
      endLabel: clock.format(new Date(session.endedAt)),
      durationMinutes: sessionMinutes(session.startedAt, session.endedAt),
    }));
}
