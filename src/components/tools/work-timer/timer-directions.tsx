'use client';

import { useState } from 'react';
import { Pause, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNowMs } from '@/hooks/use-now';
import { formatElapsed } from '@/lib/work-timer/format-elapsed';
import { cn } from '@/lib/utils';

// Throwaway design preview for choosing the Work Timer's next look. Sample data only; nothing here
// reads or saves real sessions. Removed once a direction is picked.

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_HOUR = 3600;
const DAILY_GOAL_SECONDS = 8 * SECONDS_PER_HOUR;
const SAMPLE_WORKED_TODAY_SECONDS = 3 * SECONDS_PER_HOUR + 25 * 60;
const SAMPLE_CLIENT = 'The 30k Club';
const SAMPLE_NOTE = 'Moving the Wednesday session';

const SAMPLE_ELAPSED_SECONDS = 754;

function useSampleClock() {
  const nowMs = useNowMs();
  const [startedAtMs, setStartedAtMs] = useState(
    () => Date.now() - SAMPLE_ELAPSED_SECONDS * MILLISECONDS_PER_SECOND,
  );
  const [pausedAtMs, setPausedAtMs] = useState<number | null>(null);
  const referenceMs = pausedAtMs ?? nowMs;
  const elapsedSeconds =
    referenceMs === null
      ? SAMPLE_ELAPSED_SECONDS
      : Math.floor((referenceMs - startedAtMs) / MILLISECONDS_PER_SECOND);

  function togglePause() {
    if (pausedAtMs === null) {
      setPausedAtMs(Date.now());
      return;
    }
    // Shift the start forward by the pause, so paused time is not counted.
    setStartedAtMs((current) => current + (Date.now() - pausedAtMs));
    setPausedAtMs(null);
  }

  return { elapsedSeconds, isPaused: pausedAtMs !== null, togglePause };
}

function DirectionFrame({
  letter,
  title,
  pitch,
  children,
}: {
  letter: string;
  title: string;
  pitch: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <p className="ca-eyebrow text-primary">Direction {letter}</p>
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground max-w-2xl text-sm">{pitch}</p>
      </div>
      {children}
    </section>
  );
}

function Controls({ isPaused, onPause }: { isPaused: boolean; onPause: () => void }) {
  return (
    <div className="flex gap-2">
      <Button size="lg" variant="secondary" className="h-12 rounded-full px-6" onClick={onPause}>
        {isPaused ? <Play className="fill-current" /> : <Pause className="fill-current" />}
        {isPaused ? 'Resume' : 'Pause'}
      </Button>
      <Button size="lg" className="h-12 rounded-full px-6">
        <Square className="fill-current" />
        Stop
      </Button>
    </div>
  );
}

const RING_RADIUS = 120;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function FocusRing() {
  const { elapsedSeconds, isPaused, togglePause } = useSampleClock();
  const todaySeconds = SAMPLE_WORKED_TODAY_SECONDS + elapsedSeconds;
  const progress = Math.min(1, todaySeconds / DAILY_GOAL_SECONDS);
  return (
    <div className="bg-card relative overflow-hidden rounded-3xl border p-8">
      <div aria-hidden className="bg-ledger absolute inset-0 opacity-70" />
      <div className="relative flex flex-col items-center gap-6">
        <span className="bg-accent text-accent-foreground rounded-full px-3 py-1 text-xs font-medium">
          {SAMPLE_CLIENT} · {SAMPLE_NOTE}
        </span>
        <div className="relative size-72">
          <svg viewBox="0 0 280 280" className="size-full -rotate-90">
            <circle
              cx="140"
              cy="140"
              r={RING_RADIUS}
              fill="none"
              stroke="var(--muted)"
              strokeWidth="14"
            />
            <circle
              cx="140"
              cy="140"
              r={RING_RADIUS}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
              className="transition-[stroke-dashoffset] duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className={cn('font-figures text-4xl font-medium', isPaused && 'opacity-50')}>
              {formatElapsed(elapsedSeconds)}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {formatElapsed(todaySeconds).slice(0, 5)} of 08:00 today
            </p>
          </div>
        </div>
        <Controls isPaused={isPaused} onPause={togglePause} />
      </div>
    </div>
  );
}

const DAY_START_HOUR = 9;
const DAY_END_HOUR = 19;
const SAMPLE_BLOCKS = [
  { start: 9.25, end: 10.5, label: 'Circle sessions' },
  { start: 11, end: 12.4, label: 'Onboarding' },
  { start: 14, end: 14.75, label: 'Zoom glitch' },
];

function DayTimeline() {
  const { elapsedSeconds, isPaused, togglePause } = useSampleClock();
  const span = DAY_END_HOUR - DAY_START_HOUR;
  const liveStart = 15.5;
  const liveEnd = liveStart + elapsedSeconds / SECONDS_PER_HOUR;
  const position = (hour: number) => `${((hour - DAY_START_HOUR) / span) * 100}%`;
  return (
    <div className="bg-card space-y-6 rounded-3xl border p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">
            {SAMPLE_CLIENT} · {SAMPLE_NOTE}
          </p>
          <p className={cn('font-figures text-6xl font-medium', isPaused && 'opacity-50')}>
            {formatElapsed(elapsedSeconds)}
          </p>
        </div>
        <Controls isPaused={isPaused} onPause={togglePause} />
      </div>
      <div className="space-y-2">
        <div className="bg-muted relative h-14 overflow-hidden rounded-2xl">
          {SAMPLE_BLOCKS.map((block) => (
            <div
              key={block.label}
              title={block.label}
              className="bg-primary/25 border-primary/40 absolute inset-y-2 rounded-lg border"
              style={{
                left: position(block.start),
                width: `calc(${position(block.end)} - ${position(block.start)})`,
              }}
            />
          ))}
          <div
            className="bg-primary absolute inset-y-2 rounded-lg shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_20%,transparent)] motion-safe:animate-pulse"
            style={{
              left: position(liveStart),
              width: `max(6px, calc(${position(liveEnd)} - ${position(liveStart)}))`,
            }}
          />
        </div>
        <div className="font-figures text-muted-foreground flex justify-between text-xs">
          {Array.from({ length: span / 2 + 1 }, (_, index) => DAY_START_HOUR + index * 2).map(
            (hour) => (
              <span key={hour}>{String(hour).padStart(2, '0')}:00</span>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function FloatingChip() {
  const { elapsedSeconds, isPaused, togglePause } = useSampleClock();
  return (
    <div className="bg-card overflow-hidden rounded-3xl border">
      <div className="flex h-14 items-center justify-between border-b px-4">
        <span className="text-muted-foreground text-sm">Any page · Time Tracking › Log</span>
        <div className="bg-primary text-primary-foreground flex items-center gap-2 rounded-full py-1 pr-1 pl-3 shadow-lg">
          <span
            className={cn(
              'size-2 rounded-full bg-emerald-300',
              !isPaused && 'motion-safe:animate-pulse',
            )}
          />
          <span className="font-figures text-sm">{formatElapsed(elapsedSeconds)}</span>
          <span className="text-primary-foreground/70 hidden text-xs sm:inline">
            {SAMPLE_CLIENT}
          </span>
          <button
            type="button"
            onClick={togglePause}
            className="bg-primary-foreground/15 hover:bg-primary-foreground/25 flex size-7 items-center justify-center rounded-full"
            aria-label={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? (
              <Play className="size-3.5 fill-current" />
            ) : (
              <Pause className="size-3.5 fill-current" />
            )}
          </button>
          <button
            type="button"
            className="bg-primary-foreground/15 hover:bg-primary-foreground/25 flex size-7 items-center justify-center rounded-full"
            aria-label="Stop"
          >
            <Square className="size-3 fill-current" />
          </button>
        </div>
      </div>
      <div className="text-muted-foreground grid h-40 place-items-center text-sm">
        The timer follows you on every page; the Work Timer page becomes your history.
      </div>
    </div>
  );
}

export function TimerDirections() {
  return (
    <div className="space-y-12">
      <DirectionFrame
        letter="A"
        title="Focus ring"
        pitch="One calm, centred clock. The ring fills toward an 8-hour day, so you see today's total at a glance."
      >
        <FocusRing />
      </DirectionFrame>
      <DirectionFrame
        letter="B"
        title="Day timeline"
        pitch="Today as a strip of blocks. Each session is a block and the running one grows live, so gaps and long stretches stand out."
      >
        <DayTimeline />
      </DirectionFrame>
      <DirectionFrame
        letter="C"
        title="Floating chip"
        pitch="A small pill in the top bar on every page. Start, pause and stop without leaving the work you're logging."
      >
        <FloatingChip />
      </DirectionFrame>
    </div>
  );
}
