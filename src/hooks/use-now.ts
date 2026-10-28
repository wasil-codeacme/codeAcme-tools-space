'use client';

import { useSyncExternalStore } from 'react';

// Four updates a second keeps a seconds display in step with real time without visible lag.
const TICK_MS = 250;

function subscribe(onTick: () => void) {
  const timer = window.setInterval(onTick, TICK_MS);
  return () => window.clearInterval(timer);
}

// The device time, quantised to the tick so the snapshot stays stable between ticks. Null during
// server rendering so a live clock never causes a hydration mismatch.
export function useNowMs(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / TICK_MS) * TICK_MS,
    () => null,
  );
}
