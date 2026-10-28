'use client';

import { useState } from 'react';
import { History, UsersRound } from 'lucide-react';
import { EditSessionDialog } from '@/components/tools/work-timer/edit-session-dialog';
import { SessionRow } from '@/components/tools/work-timer/session-row';
import { SessionHistorySkeleton } from '@/components/tools/work-timer/skeletons';
import { PendingSection } from '@/components/platform/pending-navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSearchParamNavigation } from '@/hooks/use-search-param-navigation';
import { DAYS_PER_WEEK } from '@/lib/constants';
import {
  type DateKey,
  addDaysToKey,
  formatDateKey,
  weekStartKey,
} from '@/lib/time-tracking/date-key';
import { formatDecimalHours, formatDuration } from '@/lib/time-tracking/duration';
import { groupBySheetWeek } from '@/lib/time-tracking/group-by-sheet-week';
import type { WorkSessionHistoryItem } from '@/types/work-timer';

interface SessionHistoryProps {
  items: WorkSessionHistoryItem[];
  todayKey: DateKey;
  clients: { id: string; name: string }[];
  currentUserId: string;
  isAdmin: boolean;
  members: { id: string; name: string }[];
  selectedMember: string;
  everyoneValue: string;
}

function minutesBetween(
  items: readonly WorkSessionHistoryItem[],
  startKey: DateKey,
  endKey: DateKey,
) {
  return items
    .filter((item) => item.dateKey >= startKey && item.dateKey <= endKey)
    .reduce((sum, item) => sum + item.durationMinutes, 0);
}

function Stat({ label, minutes }: { label: string; minutes: number }) {
  return (
    <div className="bg-card rounded-2xl border p-4">
      <p className="text-muted-foreground text-[0.7rem] tracking-wider uppercase">{label}</p>
      <p className="font-figures mt-1 text-2xl font-medium">{formatDuration(minutes)}</p>
      <p className="font-figures text-muted-foreground text-xs">{formatDecimalHours(minutes)} h</p>
    </div>
  );
}

export function SessionHistory(props: SessionHistoryProps) {
  const { items, todayKey, isAdmin } = props;
  const [editing, setEditing] = useState<WorkSessionHistoryItem | null>(null);
  const { navigate } = useSearchParamNavigation();
  const weekStart = weekStartKey(todayKey);
  const monthPrefix = todayKey.slice(0, 7);
  const showAuthor = isAdmin && props.selectedMember === props.everyoneValue;

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Today" minutes={minutesBetween(items, todayKey, todayKey)} />
        <Stat
          label="This week"
          minutes={minutesBetween(items, weekStart, addDaysToKey(weekStart, DAYS_PER_WEEK - 1))}
        />
        <Stat
          label={formatDateKey(todayKey, 'MMMM')}
          minutes={minutesBetween(items, `${monthPrefix}-01`, `${monthPrefix}-31`)}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <h2 className="font-heading flex items-center gap-2 text-lg font-semibold tracking-tight">
          <History className="text-muted-foreground size-4" />
          History
        </h2>
        {isAdmin && (
          <Select value={props.selectedMember} onValueChange={(member) => navigate({ member })}>
            <SelectTrigger className="bg-card min-w-48" aria-label="Whose history">
              <UsersRound className="text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={props.everyoneValue}>Everyone</SelectItem>
              {props.members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.id === props.currentUserId ? `${member.name} (you)` : member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <PendingSection fallback={<SessionHistorySkeleton />}>
        {items.length === 0 ? (
          <p className="bg-card/60 text-muted-foreground rounded-2xl border border-dashed p-10 text-center text-sm">
            Finished sessions from the last two months show up here.
          </p>
        ) : (
          groupBySheetWeek(items)
            .reverse()
            .map((month) => (
              <div key={month.monthLabel} className="space-y-3">
                <div className="bg-accent text-accent-foreground flex items-baseline justify-between rounded-xl px-4 py-2.5">
                  <span className="font-heading font-semibold">{month.monthLabel}</span>
                  <span className="font-figures text-sm font-semibold">
                    {formatDuration(month.totalMinutes)} · {formatDecimalHours(month.totalMinutes)}{' '}
                    h
                  </span>
                </div>
                {[...month.weeks].reverse().map((week) => (
                  <div key={week.index} className="bg-card overflow-hidden rounded-2xl border">
                    <p className="text-primary flex items-baseline justify-between border-b px-4 py-2 text-xs font-semibold tracking-wide uppercase">
                      <span>
                        Week {week.index} · {week.rangeLabel}
                      </span>
                      <span className="font-figures normal-case">
                        {formatDuration(week.totalMinutes)}
                      </span>
                    </p>
                    {[...week.days].reverse().map((day) => (
                      <div key={day.dateKey} className="border-b last:border-b-0">
                        <p className="text-muted-foreground flex justify-between px-4 pt-2.5 pb-1 text-xs font-medium">
                          <span>{formatDateKey(day.dateKey, 'EEEE d MMMM')}</span>
                          <span className="font-figures">{formatDuration(day.totalMinutes)}</span>
                        </p>
                        <ul>
                          {day.items.map((item) => (
                            <SessionRow
                              key={item.id}
                              session={item}
                              showAuthor={showAuthor}
                              canModify={isAdmin || item.userId === props.currentUserId}
                              onEdit={() => setEditing(item)}
                            />
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))
        )}
      </PendingSection>

      {editing && (
        <EditSessionDialog
          session={editing}
          clients={props.clients}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
