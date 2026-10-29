import 'server-only';
import { type DateKey } from '@/lib/time-tracking/date-key';
import {
  type MyHoursSummary,
  summarizeMyHours,
  summaryStartKey,
} from '@/lib/time-tracking/my-hours';
import { listAccessibleClients } from '@/server/policies/client-access.policy';
import { timeEntryRepository } from '@/server/repositories/time-tracking/time-entry.repository';
import type { Actor } from '@/types/auth';

// The signed-in person's own logged time, across every client they can see (archived ones too, since
// the hours still happened).
export async function getMyHoursSummary(actor: Actor, today: DateKey): Promise<MyHoursSummary> {
  const clients = await listAccessibleClients(actor, { includeArchived: true });
  const days = await timeEntryRepository.sumMinutesByDay({
    clientIds: clients.map((client) => client.id),
    startKey: summaryStartKey(today),
    endKey: today,
    userId: actor.id,
  });
  return summarizeMyHours(days, today);
}
