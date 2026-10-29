import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PendingSection } from '@/components/platform/pending-navigation';
import { NoClientsState } from '@/components/tools/time-tracking/no-clients-state';
import { OverviewControls } from '@/components/tools/time-tracking/overview/overview-controls';
import { YearOverviewGrid } from '@/components/tools/time-tracking/overview/year-overview-grid';
import { ControlsSkeleton, OverviewGridSkeleton } from '@/components/tools/time-tracking/skeletons';
import { ToolId } from '@/config/tools';
import { Role } from '@/generated/prisma/enums';
import { requireToolAccess } from '@/server/auth/guards';
import { listClientsWithUsage } from '@/server/services/time-tracking/client.service';
import { getYearOverview } from '@/server/services/time-tracking/time-overview.service';
import { getTodayKey } from '@/server/time-zone';

export const metadata: Metadata = { title: 'Time · Overview' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const MIN_YEAR = 2020;
const MAX_YEAR = 2100;

function parseYear(value: string | string[] | undefined, fallback: number): number {
  const year = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR ? year : fallback;
}

async function OverviewContent({ searchParams }: { searchParams: SearchParams }) {
  const [actor, params, today] = await Promise.all([
    requireToolAccess(ToolId.TIME_TRACKING),
    searchParams,
    getTodayKey(),
  ]);
  const clients = await listClientsWithUsage(actor, {
    monthKey: today,
    includeArchived: actor.role === Role.ADMIN,
  });
  const requestedClientId = Array.isArray(params.client) ? params.client[0] : params.client;
  const client = clients.find((candidate) => candidate.id === requestedClientId) ?? clients[0];
  if (!client) {
    return <NoClientsState isAdmin={actor.role === Role.ADMIN} />;
  }
  const year = parseYear(params.year, Number(today.slice(0, 4)));
  const overview = await getYearOverview(actor, { clientId: client.id, year });

  return (
    <div className="space-y-5">
      <OverviewControls
        clients={clients.map(({ id, name }) => ({ id, name }))}
        clientId={client.id}
        year={year}
      />
      <PendingSection fallback={<OverviewGridSkeleton />}>
        <YearOverviewGrid
          overview={overview}
          clientId={client.id}
          clientName={client.name}
          hasLimit={client.monthlyLimitMinutes !== null}
          currentMonthKey={`${today.slice(0, 7)}-01`}
        />
      </PendingSection>
    </div>
  );
}

export default function OverviewPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense
      fallback={
        <div className="space-y-5">
          <ControlsSkeleton />
          <OverviewGridSkeleton />
        </div>
      }
    >
      <OverviewContent searchParams={searchParams} />
    </Suspense>
  );
}
