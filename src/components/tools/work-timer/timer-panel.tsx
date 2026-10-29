'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Building2, Pause, PictureInPicture2, Play, Square, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { openTimerPopOut } from '@/components/platform/timer-pop-out';
import { useWorkTimer } from '@/hooks/use-work-timer';
import { DAILY_GOAL_MINUTES, LONG_SESSION_WARNING_MINUTES } from '@/lib/constants';
import { formatElapsed } from '@/lib/work-timer/format-elapsed';
import { type LocalTimer, startTimer } from '@/lib/work-timer/local-timer';
import { cn } from '@/lib/utils';
import type { WorkSessionView } from '@/types/work-timer';

export const NO_CLIENT = 'none';
const SECONDS_PER_MINUTE = 60;
const RING_RADIUS = 132;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface TimerPanelProps {
  userId: string;
  clients: { id: string; name: string }[];
  // Saved sessions from today, so the ring shows the whole day and not just this session.
  todayWorkedMinutes: number;
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

function hoursAndMinutes(totalSeconds: number): string {
  return formatElapsed(totalSeconds).slice(0, 5);
}

const SECONDS_PER_DIAL = 60;
const MAJOR_TICK_EVERY = 5;
const DIAL_CENTER = 140;
const DEGREES_PER_SECOND = 360 / SECONDS_PER_DIAL;

// One tick of the seconds dial, drawn from the 12 o'clock position and rotated into place.
function DialTick({
  second,
  isLit,
  isCurrent,
  tone,
}: {
  second: number;
  isLit: boolean;
  isCurrent: boolean;
  tone: 'running' | 'paused' | 'idle';
}) {
  const isMajor = second % MAJOR_TICK_EVERY === 0;
  const outer = 122;
  const inner = isCurrent ? 104 : isMajor ? 110 : 115;
  const litColor = tone === 'paused' ? 'var(--ring)' : 'var(--primary)';
  return (
    <line
      x1={DIAL_CENTER}
      y1={DIAL_CENTER - outer}
      x2={DIAL_CENTER}
      y2={DIAL_CENTER - inner}
      transform={`rotate(${second * DEGREES_PER_SECOND} ${DIAL_CENTER} ${DIAL_CENTER})`}
      stroke={isLit ? litColor : 'var(--border)'}
      strokeWidth={isCurrent ? 3.5 : isMajor ? 2.5 : 1.5}
      strokeLinecap="round"
      className="transition-[stroke] duration-150"
    />
  );
}

// A stopwatch face: the digital time in the middle, a seconds dial whose ticks light up one by one
// and reset each minute, and a thin outer ring filling toward the working day.
function FocusRing({
  progress,
  seconds,
  tone,
  children,
}: {
  progress: number;
  seconds: number;
  tone: 'running' | 'paused' | 'idle';
  children: React.ReactNode;
}) {
  const currentSecond = seconds % SECONDS_PER_DIAL;
  return (
    <div className="relative size-64 sm:size-72">
      <svg viewBox="0 0 280 280" className="size-full" aria-hidden>
        <g className="origin-center -rotate-90">
          <circle
            cx={DIAL_CENTER}
            cy={DIAL_CENTER}
            r={RING_RADIUS}
            fill="none"
            stroke="var(--muted)"
            strokeWidth="4"
          />
          <circle
            cx={DIAL_CENTER}
            cy={DIAL_CENTER}
            r={RING_RADIUS}
            fill="none"
            stroke={tone === 'running' ? 'var(--primary)' : 'var(--ring)'}
            strokeOpacity={tone === 'paused' ? 0.55 : 1}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE * (1 - Math.min(1, progress))}
            className="transition-[stroke-dashoffset,stroke] duration-700 ease-out"
          />
        </g>
        {Array.from({ length: SECONDS_PER_DIAL }, (_, second) => (
          <DialTick
            key={second}
            second={second}
            tone={tone}
            isLit={tone !== 'idle' && second <= currentSecond}
            isCurrent={tone !== 'idle' && second === currentSecond}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

export function TimerPanel({
  userId,
  clients,
  todayWorkedMinutes,
  legacyRunning,
}: TimerPanelProps) {
  const [clientId, setClientId] = useState(
    clients.length === 1 ? (clients[0]?.id ?? NO_CLIENT) : NO_CLIENT,
  );
  const [note, setNote] = useState('');
  // Legacy sessions already finished here, so a stale server prop never re-adopts them.
  const finishedLegacyIds = useRef(new Set<string>());
  const markLegacyFinished = useCallback((legacySessionId: string) => {
    finishedLegacyIds.current.add(legacySessionId);
  }, []);
  const { timer, save, nowMs, paused, elapsedSeconds, togglePause, stop } = useWorkTimer(
    userId,
    markLegacyFinished,
  );

  useEffect(() => {
    if (!timer && legacyRunning && !finishedLegacyIds.current.has(legacyRunning.id)) {
      save(adoptLegacy(legacyRunning));
    }
  }, [timer, legacyRunning, save]);

  const isHydrated = nowMs !== null;
  const todaySeconds = todayWorkedMinutes * SECONDS_PER_MINUTE + elapsedSeconds;
  const progress = todaySeconds / (DAILY_GOAL_MINUTES * SECONDS_PER_MINUTE);
  const isLong = elapsedSeconds / SECONDS_PER_MINUTE >= LONG_SESSION_WARNING_MINUTES;
  const goalLabel = hoursAndMinutes(DAILY_GOAL_MINUTES * SECONDS_PER_MINUTE);

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

  return (
    <section className="ca-glow bg-card relative overflow-hidden rounded-3xl border px-5 py-8 sm:px-8">
      <div aria-hidden className="bg-ledger absolute inset-0 opacity-70" />
      <div className="relative mx-auto flex max-w-md flex-col items-center gap-6">
        <p className="ca-eyebrow text-primary flex items-center gap-2">
          {timer && !paused && (
            <span className="size-2 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
          )}
          {!timer ? 'Ready when you are' : paused ? 'Paused' : 'Working'}
        </p>

        {timer && (
          <span className="bg-accent text-accent-foreground max-w-full truncate rounded-full px-3 py-1 text-xs font-medium">
            {timer.label}
          </span>
        )}

        <FocusRing
          progress={progress}
          seconds={elapsedSeconds}
          tone={!timer ? 'idle' : paused ? 'paused' : 'running'}
        >
          <p
            className={cn(
              'font-figures text-[2.1rem] font-medium tracking-tight tabular-nums transition-opacity sm:text-[2.4rem]',
              paused && 'opacity-50',
            )}
          >
            {isHydrated ? formatElapsed(elapsedSeconds) : '--:--:--'}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            <span className="font-figures text-foreground">{hoursAndMinutes(todaySeconds)}</span> of{' '}
            {goalLabel} today
          </p>
        </FocusRing>

        {timer && isLong && (
          <p className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/12 px-2.5 py-1 text-xs text-amber-800">
            <TriangleAlert className="size-3.5" />
            Still working? This has been running for over 10 hours.
          </p>
        )}

        {timer ? (
          <div className="flex w-full justify-center gap-2">
            <Button
              size="lg"
              variant={paused ? 'default' : 'secondary'}
              onClick={togglePause}
              className="h-12 min-w-32 rounded-full px-6 text-base font-semibold"
            >
              {paused ? <Play className="fill-current" /> : <Pause className="fill-current" />}
              {paused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              size="lg"
              variant={paused ? 'secondary' : 'default'}
              onClick={() => void stop()}
              className="h-12 min-w-32 rounded-full px-6 text-base font-semibold"
            >
              <Square className="fill-current" />
              Stop
            </Button>
          </div>
        ) : null}
        {timer && (
          <Button
            variant="ghost"
            size="sm"
            onClick={openTimerPopOut}
            className="text-muted-foreground -mt-2 rounded-full"
          >
            <PictureInPicture2 />
            Pop out timer
          </Button>
        )}
        {timer ? null : (
          <div className="flex w-full flex-col gap-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="bg-card w-full sm:w-44" aria-label="Client">
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
                className="bg-card flex-1"
              />
            </div>
            <Button
              size="lg"
              onClick={start}
              disabled={!isHydrated}
              className="h-12 rounded-full text-base font-semibold"
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
