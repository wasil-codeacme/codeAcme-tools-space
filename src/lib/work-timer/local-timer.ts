// The Work Timer runs entirely in the browser: start, pause and resume never wait for the server.
// Only the finished session is sent, once, when the user presses Stop.

export interface LocalTimer {
  clientId: string | null;
  label: string;
  note: string;
  // Wall-clock start of the session (first press of Start).
  startedAtMs: number;
  // Worked time from earlier running stretches, excluding pauses.
  accumulatedMs: number;
  // When the current running stretch began; null while paused.
  runningSinceMs: number | null;
  // A timer started on the server by an earlier version of the app, finished on Stop.
  legacySessionId: string | null;
}

const MILLISECONDS_PER_SECOND = 1000;

export function startTimer(
  { clientId, label, note }: Pick<LocalTimer, 'clientId' | 'label' | 'note'>,
  nowMs: number,
): LocalTimer {
  return {
    clientId,
    label,
    note,
    startedAtMs: nowMs,
    accumulatedMs: 0,
    runningSinceMs: nowMs,
    legacySessionId: null,
  };
}

export function isPaused(timer: LocalTimer): boolean {
  return timer.runningSinceMs === null;
}

export function elapsedMs(timer: LocalTimer, nowMs: number): number {
  const running = timer.runningSinceMs === null ? 0 : Math.max(0, nowMs - timer.runningSinceMs);
  return timer.accumulatedMs + running;
}

export function pauseTimer(timer: LocalTimer, nowMs: number): LocalTimer {
  if (timer.runningSinceMs === null) {
    return timer;
  }
  return { ...timer, accumulatedMs: elapsedMs(timer, nowMs), runningSinceMs: null };
}

export function resumeTimer(timer: LocalTimer, nowMs: number): LocalTimer {
  return timer.runningSinceMs === null ? { ...timer, runningSinceMs: nowMs } : timer;
}

// What gets saved when the user stops: the worked time, plus the real start and stop moments.
export function finishTimer(timer: LocalTimer, nowMs: number) {
  const endedAtMs = Math.max(nowMs, timer.startedAtMs + MILLISECONDS_PER_SECOND);
  return {
    legacySessionId: timer.legacySessionId,
    clientId: timer.clientId,
    note: timer.note,
    startedAt: new Date(timer.startedAtMs).toISOString(),
    endedAt: new Date(endedAtMs).toISOString(),
    workedSeconds: Math.min(
      Math.floor(elapsedMs(timer, nowMs) / MILLISECONDS_PER_SECOND),
      Math.floor((endedAtMs - timer.startedAtMs) / MILLISECONDS_PER_SECOND),
    ),
  };
}

// Anything read back from storage is validated, since it may come from an older version.
export function parseLocalTimer(raw: string | null): LocalTimer | null {
  if (!raw) {
    return null;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) {
      return null;
    }
    const timer = value as Record<string, unknown>;
    const isValid =
      typeof timer.startedAtMs === 'number' &&
      typeof timer.accumulatedMs === 'number' &&
      (timer.runningSinceMs === null || typeof timer.runningSinceMs === 'number') &&
      typeof timer.label === 'string' &&
      typeof timer.note === 'string' &&
      (timer.clientId === null || typeof timer.clientId === 'string') &&
      (timer.legacySessionId === null || typeof timer.legacySessionId === 'string');
    return isValid ? (value as LocalTimer) : null;
  } catch {
    return null;
  }
}
