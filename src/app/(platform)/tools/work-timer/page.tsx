import type { Metadata } from 'next';
import { Suspense } from 'react';
import {
  SessionHistorySkeleton,
  TimerPanelSkeleton,
} from '@/components/tools/work-timer/skeletons';
import { SessionHistory } from '@/components/tools/work-timer/session-history';
import { TimerPanel } from '@/components/tools/work-timer/timer-panel';
import { ToolId, canUseTool } from '@/config/tools';
import { Role, ToolAccessLevel } from '@/generated/prisma/enums';
import { toHistoryItems } from '@/lib/work-timer/session-history';
import { requireToolAccess } from '@/server/auth/guards';
import { listAccessibleClients } from '@/server/policies/client-access.policy';
import { listActiveUsers } from '@/server/services/user.service';
import { getRunningSession, listHistory } from '@/server/services/work-timer/work-session.service';
import { getTodayKey, getUserTimeZone } from '@/server/time-zone';

export const metadata: Metadata = { title: 'Work Timer' };

// Admin history filter value for "everyone".
const EVERYONE = 'all';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function WorkTimerContent({ searchParams }: { searchParams: SearchParams }) {
  const actor = await requireToolAccess(ToolId.WORK_TIMER);
  const isAdmin = actor.role === Role.ADMIN;
  const [params, timeZone, today] = await Promise.all([
    searchParams,
    getUserTimeZone(),
    getTodayKey(),
  ]);
  const rawMember = Array.isArray(params.member) ? params.member[0] : params.member;
  const memberId = rawMember === EVERYONE ? null : rawMember;

  const now = new Date();
  const [running, sessions, clients, members] = await Promise.all([
    getRunningSession(actor),
    listHistory(actor, { memberId, now }),
    listAccessibleClients(actor),
    isAdmin ? listActiveUsers() : Promise.resolve([]),
  ]);
  const clientOptions = clients.map(({ id, name }) => ({ id, name }));
  const historyItems = toHistoryItems(sessions, timeZone);
  const todayWorkedMinutes = historyItems
    .filter((item) => item.userId === actor.id && item.dateKey === today)
    .reduce((total, item) => total + item.durationMinutes, 0);

  return (
    <div className="space-y-6">
      {canUseTool(actor, ToolId.WORK_TIMER, ToolAccessLevel.EDIT) && (
        <TimerPanel
          userId={actor.id}
          clients={clientOptions}
          todayWorkedMinutes={todayWorkedMinutes}
          legacyRunning={running}
        />
      )}
      <SessionHistory
        items={historyItems}
        todayKey={today}
        clients={clientOptions}
        currentUserId={actor.id}
        isAdmin={isAdmin}
        members={members.map(({ id, name }) => ({ id, name }))}
        selectedMember={rawMember ?? actor.id}
        everyoneValue={EVERYONE}
      />
    </div>
  );
}

export default function WorkTimerPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <TimerPanelSkeleton />
          <SessionHistorySkeleton />
        </div>
      }
    >
      <WorkTimerContent searchParams={searchParams} />
    </Suspense>
  );
}
