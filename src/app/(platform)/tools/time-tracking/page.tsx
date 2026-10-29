import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import { LogSkeleton } from '@/components/tools/time-tracking/log/log-skeleton';
import { LogWorkspace } from '@/components/tools/time-tracking/log/log-workspace';
import { NoClientsState } from '@/components/tools/time-tracking/no-clients-state';
import { ToolId, canUseTool } from '@/config/tools';
import { Role, ToolAccessLevel } from '@/generated/prisma/enums';
import { LAST_CLIENT_COOKIE } from '@/lib/constants';
import { isDateKey } from '@/lib/time-tracking/date-key';
import { requireToolAccess } from '@/server/auth/guards';
import { listClientsWithUsage } from '@/server/services/time-tracking/client.service';
import { listClientMembers } from '@/server/services/time-tracking/client-member.service';
import { listCategories } from '@/server/services/time-tracking/time-category.service';
import { getLogView } from '@/server/services/time-tracking/time-entry.service';
import { getTodayKey } from '@/server/time-zone';

export const metadata: Metadata = { title: 'Time · Log' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function LogContent({ searchParams }: { searchParams: SearchParams }) {
  const actor = await requireToolAccess(ToolId.TIME_TRACKING);
  const [params, today, cookieStore] = await Promise.all([searchParams, getTodayKey(), cookies()]);
  const clients = await listClientsWithUsage(actor, { monthKey: today });
  const isAdmin = actor.role === Role.ADMIN;

  if (clients.length === 0) {
    return <NoClientsState isAdmin={isAdmin} />;
  }

  const requestedClientId = single(params.client) ?? cookieStore.get(LAST_CLIENT_COOKIE)?.value;
  const client = clients.find((candidate) => candidate.id === requestedClientId) ?? clients[0];
  if (!client) {
    return <NoClientsState isAdmin={isAdmin} />;
  }
  const requestedDate = single(params.date);
  const selectedDate = requestedDate && isDateKey(requestedDate) ? requestedDate : today;
  const memberId = isAdmin ? single(params.member) : undefined;

  const [view, categories, members] = await Promise.all([
    getLogView(actor, { clientId: client.id, dateKey: selectedDate, memberId }),
    listCategories([client.id]),
    isAdmin ? listClientMembers(client.id) : Promise.resolve([]),
  ]);

  return (
    <LogWorkspace
      key={`${client.id}:${view.weekStartKey}:${memberId ?? 'all'}`}
      clients={clients.map(({ id, name }) => ({ id, name }))}
      client={{ id: client.id, name: client.name }}
      view={view}
      categories={categories}
      members={members}
      selectedMemberId={memberId ?? null}
      initialDate={selectedDate}
      todayKey={today}
      currentUser={{ id: actor.id, name: actor.name }}
      isAdmin={isAdmin}
      canEdit={canUseTool(actor, ToolId.TIME_TRACKING, ToolAccessLevel.EDIT)}
    />
  );
}

export default function TimeLogPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<LogSkeleton />}>
      <LogContent searchParams={searchParams} />
    </Suspense>
  );
}
