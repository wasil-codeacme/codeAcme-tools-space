import { HOURS_DECIMAL_PLACES, MINUTES_PER_HOUR } from '@/lib/constants';

export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;
  if (hours === 0) {
    return `${minutes}m`;
  }
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function formatDecimalHours(totalMinutes: number): string {
  return (totalMinutes / MINUTES_PER_HOUR).toFixed(HOURS_DECIMAL_PLACES);
}

export function hoursToMinutes(hours: number): number {
  return Math.round(hours * MINUTES_PER_HOUR);
}

export function minutesToHours(minutes: number): number {
  return minutes / MINUTES_PER_HOUR;
}
