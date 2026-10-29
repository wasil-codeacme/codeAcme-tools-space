'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Pause, Play, Square } from 'lucide-react';
import { useWorkTimer } from '@/hooks/use-work-timer';
import { ROUTES } from '@/lib/routes';
import { formatElapsed } from '@/lib/work-timer/format-elapsed';
import { cn } from '@/lib/utils';

// The running Work Timer, visible on every page so it can be paused or stopped without leaving
// the work being logged. Hidden on the Work Timer page itself, which shows the full timer.
export function HeaderTimerChip({ userId }: { userId: string }) {
  const pathname = usePathname();
  const { timer, paused, elapsedSeconds, togglePause, stop } = useWorkTimer(userId);

  if (!timer || pathname.startsWith(ROUTES.TOOLS.WORK_TIMER.ROOT)) {
    return null;
  }

  return (
    <div
      className={cn(
        'animate-in fade-in slide-in-from-top-1 ml-auto flex items-center gap-1 rounded-full py-1 pr-1 pl-3 shadow-sm duration-300',
        paused
          ? 'bg-accent text-accent-foreground'
          : 'bg-primary text-primary-foreground shadow-[0_6px_18px_-8px_var(--primary)]',
      )}
    >
      <Link
        href={ROUTES.TOOLS.WORK_TIMER.ROOT}
        className="flex min-w-0 items-center gap-2 pr-1"
        title={timer.label}
      >
        <span
          className={cn(
            'size-2 shrink-0 rounded-full',
            paused ? 'bg-current opacity-50' : 'bg-emerald-300 motion-safe:animate-pulse',
          )}
        />
        <span className="font-figures text-sm tabular-nums">{formatElapsed(elapsedSeconds)}</span>
        <span className="hidden max-w-40 truncate text-xs opacity-80 lg:inline">{timer.label}</span>
      </Link>
      <button
        type="button"
        onClick={togglePause}
        aria-label={paused ? 'Resume timer' : 'Pause timer'}
        className="flex size-7 items-center justify-center rounded-full bg-current/15 transition-colors duration-150 hover:bg-current/25"
      >
        {paused ? (
          <Play className="size-3.5 fill-current" />
        ) : (
          <Pause className="size-3.5 fill-current" />
        )}
      </button>
      <button
        type="button"
        onClick={() => void stop()}
        aria-label="Stop timer"
        className="flex size-7 items-center justify-center rounded-full bg-current/15 transition-colors duration-150 hover:bg-current/25"
      >
        <Square className="size-3 fill-current" />
      </button>
    </div>
  );
}
