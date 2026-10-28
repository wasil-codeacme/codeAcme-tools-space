import 'server-only';
import { cookies } from 'next/headers';
import { connection } from 'next/server';
import { DEFAULT_TIME_ZONE, TIME_ZONE_COOKIE } from '@/lib/constants';
import { type DateKey, isValidTimeZone, todayKey } from '@/lib/time-tracking/date-key';

// The browser's time zone is captured at sign-in, so "today" on the server matches the user's day.
export async function getUserTimeZone(): Promise<string> {
  const store = await cookies();
  const timeZone = store.get(TIME_ZONE_COOKIE)?.value;
  return timeZone && isValidTimeZone(timeZone) ? timeZone : DEFAULT_TIME_ZONE;
}

export async function getTodayKey(): Promise<DateKey> {
  const timeZone = await getUserTimeZone();
  // "Today" depends on the clock, so it must be computed per request, never prerendered.
  await connection();
  return todayKey(timeZone);
}
