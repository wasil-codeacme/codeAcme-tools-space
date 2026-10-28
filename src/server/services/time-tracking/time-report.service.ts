import 'server-only';
import { resolvePeriod } from '@/lib/time-tracking/report-period';
import { type DateKey } from '@/lib/time-tracking/date-key';
import { assertClientAccess } from '@/server/policies/client-access.policy';
import { timeEntryRepository } from '@/server/repositories/time-tracking/time-entry.repository';
import { aggregateTimeReport } from '@/server/services/time-tracking/time-report.aggregate';
import type { Actor } from '@/types/auth';
import type { TimeReport } from '@/types/time-report';
import type { ReportQuery } from '@/server/validators/time-tracking/time-report.schema';

export async function buildTimeReport(
  actor: Actor,
  { clientId, period, date }: Pick<ReportQuery, 'clientId' | 'period' | 'date'>,
  generatedOn: DateKey,
): Promise<TimeReport> {
  const client = await assertClientAccess(actor, clientId, { allowArchived: true });
  const resolved = resolvePeriod(period, date);
  const entries = await timeEntryRepository.listInRange({
    clientIds: [client.id],
    startKey: resolved.startKey,
    endKey: resolved.endKey,
  });
  return aggregateTimeReport({ client, period: resolved, entries, generatedOn });
}
