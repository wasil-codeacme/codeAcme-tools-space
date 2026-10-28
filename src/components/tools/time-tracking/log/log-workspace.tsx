'use client';

import { useRef, useState } from 'react';
import { PendingSection } from '@/components/platform/pending-navigation';
import { DayPanel } from '@/components/tools/time-tracking/log/day-panel';
import { LogToolbar } from '@/components/tools/time-tracking/log/log-toolbar';
import { PasteNotesDialog } from '@/components/tools/time-tracking/log/paste-notes-dialog';
import { ShortcutsCard } from '@/components/tools/time-tracking/log/shortcuts-card';
import { WeekHeader } from '@/components/tools/time-tracking/log/week-header';
import { WeekStrip } from '@/components/tools/time-tracking/log/week-strip';
import { MonthUsageMeter } from '@/components/tools/time-tracking/month-usage-meter';
import {
  DayPanelSkeleton,
  UsageMeterSkeleton,
  WeekStripSkeleton,
} from '@/components/tools/time-tracking/skeletons';
import { useEntryMutations } from '@/hooks/use-entry-mutations';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useSearchParamNavigation } from '@/hooks/use-search-param-navigation';
import {
  DAYS_PER_WEEK,
  LAST_CLIENT_COOKIE,
  LAST_CLIENT_COOKIE_MAX_AGE_SECONDS,
} from '@/lib/constants';
import { type DateKey, addDaysToKey, daysBetweenKeys } from '@/lib/time-tracking/date-key';
import type {
  CategoryOption,
  ClientMemberView,
  LogView,
  TimeEntryView,
} from '@/types/time-tracking';

interface LogWorkspaceProps {
  clients: { id: string; name: string }[];
  client: { id: string; name: string };
  view: LogView;
  categories: CategoryOption[];
  members: ClientMemberView[];
  selectedMemberId: string | null;
  initialDate: DateKey;
  todayKey: DateKey;
  currentUser: { id: string; name: string };
  isAdmin: boolean;
}

function minutesByDay(entries: readonly TimeEntryView[]): Map<DateKey, number> {
  const totals = new Map<DateKey, number>();
  for (const entry of entries) {
    totals.set(entry.dateKey, (totals.get(entry.dateKey) ?? 0) + entry.durationMinutes);
  }
  return totals;
}

export function LogWorkspace(props: LogWorkspaceProps) {
  const { client, view, todayKey, currentUser, isAdmin } = props;
  const [selectedDate, setSelectedDate] = useState(props.initialDate);
  const [isPasteOpen, setPasteOpen] = useState(false);
  const durationInputRef = useRef<HTMLInputElement | null>(null);
  const { navigate, replaceQuietly } = useSearchParamNavigation();
  const mutations = useEntryMutations(view.entries, client.name);

  const days = daysBetweenKeys(view.weekStartKey, view.weekEndKey);
  const totals = minutesByDay(mutations.entries);
  const weekTotal = [...totals.values()].reduce((sum, minutes) => sum + minutes, 0);
  const hasSeveralAuthors = new Set(mutations.entries.map((entry) => entry.userId)).size > 1;

  // Days inside the loaded week switch instantly; other weeks load from the server.
  function goToDate(dateKey: DateKey) {
    if (days.includes(dateKey)) {
      setSelectedDate(dateKey);
      replaceQuietly({ date: dateKey });
    } else {
      navigate({ date: dateKey });
    }
  }

  function changeClient(clientId: string) {
    document.cookie = `${LAST_CLIENT_COOKIE}=${clientId}; path=/; max-age=${LAST_CLIENT_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
    navigate({ client: clientId, member: null });
  }

  useKeyboardShortcuts({
    n: () => durationInputRef.current?.focus(),
    t: () => goToDate(todayKey),
    p: () => setPasteOpen(true),
    ArrowLeft: () => goToDate(addDaysToKey(selectedDate, -1)),
    ArrowRight: () => goToDate(addDaysToKey(selectedDate, 1)),
  });

  return (
    <div className="space-y-5">
      <LogToolbar
        clients={props.clients}
        clientId={client.id}
        members={props.members}
        selectedMemberId={props.selectedMemberId}
        isAdmin={isAdmin}
        onClientChange={changeClient}
        onMemberChange={(memberId) => navigate({ member: memberId })}
        onPaste={() => setPasteOpen(true)}
      />
      <section className="bg-card space-y-4 rounded-2xl border p-4 sm:p-5">
        <WeekHeader
          weekStartKey={view.weekStartKey}
          weekEndKey={view.weekEndKey}
          selectedKey={selectedDate}
          weekTotalMinutes={weekTotal}
          onPrevious={() => goToDate(addDaysToKey(selectedDate, -DAYS_PER_WEEK))}
          onNext={() => goToDate(addDaysToKey(selectedDate, DAYS_PER_WEEK))}
          onToday={() => goToDate(todayKey)}
        />
        <PendingSection fallback={<WeekStripSkeleton />}>
          <WeekStrip
            days={days}
            minutesByDay={totals}
            selectedKey={selectedDate}
            todayKey={todayKey}
            onSelect={goToDate}
          />
        </PendingSection>
      </section>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_290px]">
        <PendingSection fallback={<DayPanelSkeleton />}>
          <DayPanel
            key={selectedDate}
            entries={mutations.entries.filter((entry) => entry.dateKey === selectedDate)}
            context={{
              clientId: client.id,
              dateKey: selectedDate,
              author: currentUser,
              categories: props.categories,
            }}
            categories={props.categories}
            canModify={(entry) => isAdmin || entry.userId === currentUser.id}
            showAuthor={hasSeveralAuthors}
            durationInputRef={durationInputRef}
            onCreate={mutations.create}
            onUpdate={mutations.update}
            onDelete={mutations.remove}
          />
        </PendingSection>
        <aside className="space-y-4">
          <PendingSection fallback={<UsageMeterSkeleton />}>
            <MonthUsageMeter usage={view.monthUsage} />
          </PendingSection>
          <ShortcutsCard />
        </aside>
      </div>
      <PasteNotesDialog
        open={isPasteOpen}
        onOpenChange={setPasteOpen}
        clientId={client.id}
        clientName={client.name}
        categories={props.categories}
        defaultDateKey={selectedDate}
      />
    </div>
  );
}
