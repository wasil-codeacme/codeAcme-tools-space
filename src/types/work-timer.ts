import type { DateKey } from '@/lib/time-tracking/date-key';

export interface WorkSessionView {
  id: string;
  userId: string;
  userName: string;
  clientId: string | null;
  clientName: string | null;
  note: string | null;
  startedAt: string;
  endedAt: string | null;
  isLogged: boolean;
}

// A finished session prepared for display in the viewer's time zone.
export interface WorkSessionHistoryItem extends WorkSessionView {
  dateKey: DateKey;
  startLabel: string;
  endLabel: string;
  durationMinutes: number;
}
