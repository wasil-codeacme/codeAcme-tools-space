'use client';

import { useState, useTransition } from 'react';
import { Building2, Play, Square, TriangleAlert } from 'lucide-react';
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
import { useNowMs } from '@/hooks/use-now';
import { reportActionError } from '@/lib/action-feedback';
import { LONG_SESSION_WARNING_MINUTES } from '@/lib/constants';
import { MESSAGES } from '@/lib/messages';
import { formatDuration } from '@/lib/time-tracking/duration';
import { formatElapsed } from '@/lib/work-timer/format-elapsed';
import { cn } from '@/lib/utils';
import {
  startWorkSession,
  stopWorkSession,
} from '@/server/actions/work-timer/work-session.actions';
import type { WorkSessionView } from '@/types/work-timer';

export const NO_CLIENT = 'none';
const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

interface TimerPanelProps {
  running: WorkSessionView | null;
  clients: { id: string; name: string }[];
  // Server clock when the page rendered; lets the clock measure elapsed time without trusting
  // that the device clock agrees with the server.
  serverNowMs: number;
}

// The elapsed time when the anchor was taken, and the device time at that moment. Elapsed is then
// "anchor elapsed + device time since the anchor", so a device clock that is minutes off never
// freezes or skews the display.
interface ClockAnchor {
  elapsedMs: number;
  deviceMs: number;
}

interface LocalRun {
  anchor: ClockAnchor;
  label: string;
}

function ElapsedClock({ anchor }: { anchor: ClockAnchor }) {
  const nowMs = useNowMs();
  if (nowMs === null) {
    return <ClockFace text="--:--:--" />;
  }
  const elapsedSeconds = Math.floor(
    (anchor.elapsedMs + nowMs - anchor.deviceMs) / MILLISECONDS_PER_SECOND,
  );
  return (
    <>
      <ClockFace text={formatElapsed(elapsedSeconds)} />
      {elapsedSeconds / SECONDS_PER_MINUTE >= LONG_SESSION_WARNING_MINUTES && (
        <p className="bg-primary-foreground/15 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs">
          <TriangleAlert className="size-3.5" />
          Still working? This has been running for over 10 hours.
        </p>
      )}
    </>
  );
}

// Anchors a session loaded from the server: its elapsed time per the server clock at render,
// paired with the device time when this component first rendered.
function ServerSessionClock({ serverElapsedMs }: { serverElapsedMs: number }) {
  const [deviceMs] = useState(() => Date.now());
  return <ElapsedClock anchor={{ elapsedMs: serverElapsedMs, deviceMs }} />;
}

function ClockFace({ text }: { text: string }) {
  return (
    <p className="font-figures text-6xl leading-none font-medium tracking-tight tabular-nums sm:text-7xl">
      {text}
    </p>
  );
}

export function TimerPanel({ running, clients, serverNowMs }: TimerPanelProps) {
  const [clientId, setClientId] = useState(
    clients.length === 1 ? (clients[0]?.id ?? NO_CLIENT) : NO_CLIENT,
  );
  const [note, setNote] = useState('');
  // Start and Stop update the screen immediately; the server catches up in the background.
  const [localRun, setLocalRun] = useState<LocalRun | null>(null);
  const [stoppedLocally, setStoppedLocally] = useState(false);
  const [, startTransition] = useTransition();

  const isRunning = !stoppedLocally && (localRun !== null || running !== null);
  const runningLabel =
    localRun?.label ??
    [running?.clientName ?? 'No client', running?.note].filter(Boolean).join(' · ');

  function start() {
    const clientName = clients.find((client) => client.id === clientId)?.name ?? 'No client';
    setStoppedLocally(false);
    setLocalRun({
      anchor: { elapsedMs: 0, deviceMs: Date.now() },
      label: [clientName, note.trim()].filter(Boolean).join(' · '),
    });
    startTransition(async () => {
      const result = await startWorkSession({
        clientId: clientId === NO_CLIENT ? null : clientId,
        note,
      });
      if (result.error !== undefined) {
        setLocalRun(null);
        reportActionError(result.error);
        return;
      }
      setNote('');
      toast.success(MESSAGES.TIMER.STARTED);
    });
  }

  function stop() {
    setStoppedLocally(true);
    setLocalRun(null);
    startTransition(async () => {
      const result = await stopWorkSession({});
      if (result.error !== undefined) {
        setStoppedLocally(false);
        reportActionError(result.error);
        return;
      }
      toast.success(MESSAGES.TIMER.STOPPED(formatDuration(result.data.durationMinutes)));
    });
  }

  function clock() {
    if (localRun) {
      return <ElapsedClock anchor={localRun.anchor} />;
    }
    if (running) {
      return (
        <ServerSessionClock
          key={`${running.id}:${serverNowMs}`}
          serverElapsedMs={serverNowMs - new Date(running.startedAt).getTime()}
        />
      );
    }
    return <ClockFace text="00:00:00" />;
  }

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-3xl border p-6 transition-colors duration-300 sm:p-8',
        isRunning ? 'border-primary/40 bg-primary text-primary-foreground' : 'bg-card',
      )}
    >
      {isRunning && (
        <span
          aria-hidden
          className="bg-primary-foreground/10 pointer-events-none absolute -top-24 -right-24 size-72 rounded-full blur-3xl motion-safe:animate-pulse"
        />
      )}
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p
            className={cn(
              'font-figures text-xs tracking-[0.2em] uppercase',
              isRunning ? 'text-primary-foreground/70' : 'text-muted-foreground',
            )}
          >
            {isRunning ? 'Working' : 'Ready when you are'}
          </p>
          {isRunning ? clock() : <ClockFace text="00:00:00" />}
          {isRunning && <p className="text-primary-foreground/80 text-sm">{runningLabel}</p>}
        </div>

        {isRunning ? (
          <Button
            size="lg"
            variant="secondary"
            onClick={stop}
            className="h-16 min-w-44 rounded-2xl text-base font-semibold"
          >
            <Square className="fill-current" />
            Stop
          </Button>
        ) : (
          <div className="flex w-full flex-col gap-2 md:w-auto md:min-w-[26rem]">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="sm:w-48" aria-label="Client">
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
                onKeyDown={(event) => event.key === 'Enter' && start()}
                placeholder="What are you working on? (optional)"
                aria-label="Note"
                className="flex-1"
              />
            </div>
            <Button size="lg" onClick={start} className="h-16 rounded-2xl text-base font-semibold">
              <Play className="fill-current" />
              Start working
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
