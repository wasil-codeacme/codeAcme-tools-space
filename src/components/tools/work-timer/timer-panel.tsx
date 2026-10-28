'use client';

import { useState, useTransition } from 'react';
import { Building2, Loader2, Play, Square, TriangleAlert } from 'lucide-react';
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
import { useNowSeconds } from '@/hooks/use-now';
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
}

export function TimerPanel({ running, clients }: TimerPanelProps) {
  const [clientId, setClientId] = useState(
    clients.length === 1 ? (clients[0]?.id ?? NO_CLIENT) : NO_CLIENT,
  );
  const [note, setNote] = useState('');
  const [isPending, startTransition] = useTransition();
  const nowSeconds = useNowSeconds();
  const elapsedSeconds =
    running && nowSeconds !== null
      ? nowSeconds - Math.floor(new Date(running.startedAt).getTime() / MILLISECONDS_PER_SECOND)
      : 0;
  const isLong = elapsedSeconds / SECONDS_PER_MINUTE >= LONG_SESSION_WARNING_MINUTES;

  function start() {
    startTransition(async () => {
      const result = await startWorkSession({
        clientId: clientId === NO_CLIENT ? null : clientId,
        note,
      });
      if (result.error !== undefined) {
        reportActionError(result.error);
        return;
      }
      setNote('');
      toast.success(MESSAGES.TIMER.STARTED);
    });
  }

  function stop() {
    startTransition(async () => {
      const result = await stopWorkSession({});
      if (result.error !== undefined) {
        reportActionError(result.error);
        return;
      }
      toast.success(MESSAGES.TIMER.STOPPED(formatDuration(result.data.durationMinutes)));
    });
  }

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-3xl border p-6 transition-colors duration-500 sm:p-8',
        running ? 'border-primary/40 bg-primary text-primary-foreground' : 'bg-card',
      )}
    >
      {running && (
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
              running ? 'text-primary-foreground/70' : 'text-muted-foreground',
            )}
          >
            {running ? 'Working' : 'Ready when you are'}
          </p>
          <p className="font-figures text-6xl leading-none font-medium tracking-tight tabular-nums sm:text-7xl">
            {running
              ? nowSeconds === null
                ? '--:--:--'
                : formatElapsed(elapsedSeconds)
              : '00:00:00'}
          </p>
          {running && (
            <p className="text-primary-foreground/80 text-sm">
              {[running.clientName ?? 'No client', running.note].filter(Boolean).join(' · ')}
            </p>
          )}
          {running && isLong && (
            <p className="bg-primary-foreground/15 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs">
              <TriangleAlert className="size-3.5" />
              Still working? This has been running for over 10 hours.
            </p>
          )}
        </div>

        {running ? (
          <Button
            size="lg"
            variant="secondary"
            onClick={stop}
            disabled={isPending}
            className="h-16 min-w-44 rounded-2xl text-base font-semibold"
          >
            {isPending ? <Loader2 className="animate-spin" /> : <Square className="fill-current" />}
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
            <Button
              size="lg"
              onClick={start}
              disabled={isPending}
              className="h-16 rounded-2xl text-base font-semibold"
            >
              {isPending ? <Loader2 className="animate-spin" /> : <Play className="fill-current" />}
              Start working
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
