'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useLocalTimer } from '@/hooks/use-local-timer';
import { useNowMs } from '@/hooks/use-now';
import { reportActionError } from '@/lib/action-feedback';
import { MESSAGES } from '@/lib/messages';
import { formatDuration } from '@/lib/time-tracking/duration';
import {
  elapsedMs,
  finishTimer,
  isPaused,
  pauseTimer,
  resumeTimer,
} from '@/lib/work-timer/local-timer';
import { recordWorkSession } from '@/server/actions/work-timer/work-session.actions';

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

// The running timer and its controls, shared by the Work Timer page and the top-bar chip so both
// always agree. The timer lives in the browser; only Stop talks to the server.
export function useWorkTimer(userId: string, onBeforeStop?: (legacySessionId: string) => void) {
  const { timer, save } = useLocalTimer(userId);
  const nowMs = useNowMs();
  const paused = timer !== null && isPaused(timer);
  const elapsedSeconds =
    timer && nowMs !== null ? Math.floor(elapsedMs(timer, nowMs) / MILLISECONDS_PER_SECOND) : 0;

  const togglePause = useCallback(() => {
    if (timer) {
      save(isPaused(timer) ? resumeTimer(timer, Date.now()) : pauseTimer(timer, Date.now()));
    }
  }, [timer, save]);

  // The panel resets immediately; if the save fails, the timer is put back so no time is lost and
  // Stop can be pressed again. Returns whether the session was saved.
  const stop = useCallback(async (): Promise<boolean> => {
    if (!timer) {
      return false;
    }
    const finished = finishTimer(timer, Date.now());
    if (timer.legacySessionId) {
      onBeforeStop?.(timer.legacySessionId);
    }
    save(null);
    const result = await recordWorkSession(finished);
    if (result.error !== undefined) {
      save(timer);
      reportActionError(result.error);
      return false;
    }
    toast.success(
      MESSAGES.TIMER.STOPPED(
        formatDuration(Math.round(finished.workedSeconds / SECONDS_PER_MINUTE)),
      ),
    );
    return true;
  }, [timer, save, onBeforeStop]);

  return { timer, save, nowMs, paused, elapsedSeconds, togglePause, stop };
}
