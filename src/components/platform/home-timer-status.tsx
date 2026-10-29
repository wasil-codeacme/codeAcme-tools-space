'use client';

import Link from 'next/link';
import { Play, Timer } from 'lucide-react';
import { useLocalTimer } from '@/hooks/use-local-timer';
import { useNowMs } from '@/hooks/use-now';
import { ROUTES } from '@/lib/routes';
import { formatElapsed } from '@/lib/work-timer/format-elapsed';
import { elapsedMs, isPaused } from '@/lib/work-timer/local-timer';
import { cn } from '@/lib/utils';

const MILLISECONDS_PER_SECOND = 1000;

// The Work Timer lives in the browser, so its status on the home page is read from the same store.
export function HomeTimerStatus({ userId }: { userId: string }) {
  const { timer } = useLocalTimer(userId);
  const nowMs = useNowMs();
  const isRunning = timer !== null && !isPaused(timer);

  return (
    <Link
      href={ROUTES.TOOLS.WORK_TIMER.ROOT}
      className={cn(
        'group flex items-center gap-3 rounded-2xl border p-4 transition-colors duration-200',
        isRunning
          ? 'border-primary/30 bg-primary text-primary-foreground hover:bg-primary/90'
          : 'bg-card hover:border-primary/30',
      )}
    >
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-xl',
          isRunning ? 'bg-primary-foreground/15' : 'bg-accent text-primary',
        )}
      >
        {timer ? <Timer className="size-5" /> : <Play className="size-4 fill-current" />}
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            'ca-eyebrow block text-[0.65rem]',
            isRunning ? 'text-primary-foreground/70' : 'text-muted-foreground',
          )}
        >
          {!timer ? 'Work timer' : isRunning ? 'Timer running' : 'Timer paused'}
        </span>
        <span className="block truncate text-sm font-medium">
          {timer && nowMs !== null ? (
            <>
              <span className="font-figures">
                {formatElapsed(Math.floor(elapsedMs(timer, nowMs) / MILLISECONDS_PER_SECOND))}
              </span>{' '}
              · {timer.label}
            </>
          ) : (
            'Start a session'
          )}
        </span>
      </span>
    </Link>
  );
}
