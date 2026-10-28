'use client';

import { useEffect, useRef, useState } from 'react';
import { Building2, Pause, Play, Square, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocalTimer } from '@/hooks/use-local-timer';
import { useNowMs } from '@/hooks/use-now';
import { reportActionError } from '@/lib/action-feedback';
import { LONG_SESSION_WARNING_MINUTES } from '@/lib/constants';
import { MESSAGES } from '@/lib/messages';
import { formatDuration } from '@/lib/time-tracking/duration';
import { formatElapsed } from '@/lib/work-timer/format-elapsed';
import {
  type LocalTimer,
  elapsedMs,
  finishTimer,
  isPaused,
  pauseTimer,
  resumeTimer,
  startTimer,
} from '@/lib/work-timer/local-timer';
import { cn } from '@/lib/utils';
import { recordWorkSession } from '@/server/actions/work-timer/work-session.actions';
import type { WorkSessionView } from '@/types/work-timer';

export const NO_CLIENT = 'none';
const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

interface TimerPanelProps {
  userId: string;
  clients: { id: string; name: string }[];
  // A timer started on the server by the previous version of the app; adopted into the browser.
  legacyRunning: WorkSessionView | null;
}

function adoptLegacy(session: WorkSessionView): LocalTimer {
  const startedAtMs = new Date(session.startedAt).getTime();
  return {
    clientId: session.clientId,
    label: [session.clientName ?? 'No client', session.note].filter(Boolean).join(' · '),
    note: session.note ?? '',
    startedAtMs,
    accumulatedMs: 0,
    runningSinceMs: startedAtMs,
    legacySessionId: session.id,
  };
}

function ClockFace({ text, dimmed = false }: { text: string; dimmed?: boolean }) {
  return (
    <p
      className={cn(
        'font-figures text-6xl leading-none font-medium tracking-tight tabular-nums transition-opacity @md:text-7xl',
        dimmed && 'opacity-60',
      )}
    >
      {text}
    </p>
  );
}

export function TimerPanel({ userId, clients, legacyRunning }: TimerPanelProps) {
  const [clientId, setClientId] = useState(
    clients.length === 1 ? (clients[0]?.id ?? NO_CLIENT) : NO_CLIENT,
  );
  const [note, setNote] = useState('');
  const { timer, save } = useLocalTimer(userId);
  const nowMs = useNowMs();
  // Legacy sessions already finished here, so a stale server prop never re-adopts them.
  const finishedLegacyIds = useRef(new Set<string>());

  useEffect(() => {
    if (!timer && legacyRunning && !finishedLegacyIds.current.has(legacyRunning.id)) {
      save(adoptLegacy(legacyRunning));
    }
  }, [timer, legacyRunning, save]);

  const isHydrated = nowMs !== null;
  const paused = timer !== null && isPaused(timer);
  const elapsedSeconds =
    timer && nowMs !== null ? Math.floor(elapsedMs(timer, nowMs) / MILLISECONDS_PER_SECOND) : 0;
  const isLong = elapsedSeconds / SECONDS_PER_MINUTE >= LONG_SESSION_WARNING_MINUTES;

  function start() {
    const clientName = clients.find((client) => client.id === clientId)?.name ?? 'No client';
    save(
      startTimer(
        {
          clientId: clientId === NO_CLIENT ? null : clientId,
          label: [clientName, note.trim()].filter(Boolean).join(' · '),
          note: note.trim(),
        },
        Date.now(),
      ),
    );
    setNote('');
  }

  // The finished session is the only thing sent to the server. The panel resets immediately; if the
  // save fails, the timer is put back so no time is lost and Stop can be pressed again.
  async function stop() {
    if (!timer) {
      return;
    }
    const finished = finishTimer(timer, Date.now());
    if (timer.legacySessionId) {
      finishedLegacyIds.current.add(timer.legacySessionId);
    }
    save(null);
    const result = await recordWorkSession(finished);
    if (result.error !== undefined) {
      if (timer.legacySessionId) {
        finishedLegacyIds.current.delete(timer.legacySessionId);
      }
      save(timer);
      reportActionError(result.error);
      return;
    }
    toast.success(
      MESSAGES.TIMER.STOPPED(
        formatDuration(Math.round(finished.workedSeconds / SECONDS_PER_MINUTE)),
      ),
    );
  }

  return (
    <section
      className={cn(
        '@container relative overflow-hidden rounded-3xl border p-6 transition-colors duration-300 sm:p-8',
        timer && !paused && 'border-primary/40 bg-primary text-primary-foreground',
        timer && paused && 'border-primary/30 bg-accent text-accent-foreground',
        !timer && 'bg-card',
      )}
    >
      {timer && !paused && (
        <span
          aria-hidden
          className="bg-primary-foreground/10 pointer-events-none absolute -top-24 -right-24 size-72 rounded-full blur-3xl motion-safe:animate-pulse"
        />
      )}
      <div className="relative flex flex-col gap-6 @4xl:flex-row @4xl:items-center @4xl:justify-between">
        <div className="space-y-2">
          <p
            className={cn(
              'font-figures text-xs tracking-[0.2em] uppercase',
              timer && !paused ? 'text-primary-foreground/70' : 'text-muted-foreground',
            )}
          >
            {!timer ? 'Ready when you are' : paused ? 'Paused' : 'Working'}
          </p>
          <ClockFace
            text={isHydrated ? formatElapsed(elapsedSeconds) : '--:--:--'}
            dimmed={paused}
          />
          {timer && (
            <p
              className={cn(
                'text-sm',
                paused ? 'text-muted-foreground' : 'text-primary-foreground/80',
              )}
            >
              {timer.label}
            </p>
          )}
          {timer && isLong && (
            <p className="inline-flex items-center gap-1.5 rounded-lg bg-black/10 px-2.5 py-1 text-xs">
              <TriangleAlert className="size-3.5" />
              Still working? This has been running for over 10 hours.
            </p>
          )}
        </div>

        {timer ? (
          <div className="grid w-full grid-cols-2 gap-2 @4xl:w-auto @4xl:min-w-[22rem]">
            <Button
              size="lg"
              variant={paused ? 'default' : 'secondary'}
              onClick={() =>
                save(paused ? resumeTimer(timer, Date.now()) : pauseTimer(timer, Date.now()))
              }
              className="h-16 rounded-2xl text-base font-semibold"
            >
              {paused ? <Play className="fill-current" /> : <Pause className="fill-current" />}
              {paused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={stop}
              className="h-16 rounded-2xl text-base font-semibold"
            >
              <Square className="fill-current" />
              Stop
            </Button>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-2 @4xl:w-auto @4xl:min-w-[26rem]">
            <div className="flex flex-col gap-2 @lg:flex-row">
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="@lg:w-48" aria-label="Client">
                  <Building2 className="text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CLIENT}>No client</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && isHydrated && start()}
                placeholder="What are you working on? (optional)"
                aria-label="Note"
                className="flex-1"
              />
            </div>
            <Button
              size="lg"
              onClick={start}
              disabled={!isHydrated}
              className="h-16 rounded-2xl text-base font-semibold"
            >
              <Play className="fill-current" />
              Start working
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
