'use client';

import { useSyncExternalStore } from 'react';

const TICK_MS = 1000;

function subscribe(onTick: () => void) {
  const timer = window.setInterval(onTick, TICK_MS);
  return () => window.clearInterval(timer);
}

// The current time in whole seconds, ticking every second. Null during server rendering so a live
// clock never causes a hydration mismatch.
export function useNowSeconds(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / TICK_MS),
    () => null,
  );
}
