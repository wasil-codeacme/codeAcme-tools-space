'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { type LocalTimer, parseLocalTimer } from '@/lib/work-timer/local-timer';

const STORAGE_PREFIX = 'codeacme_tools_work_timer:';
// Same-tab writes do not fire the browser's `storage` event, so they are announced with this one.
const CHANGE_EVENT = 'codeacme-work-timer-change';

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

// Fallback when storage is unavailable (private mode, blocked site data): the timer still works for
// this page view, it just will not survive a reload.
const memoryStore = new Map<string, string>();

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memoryStore.get(key) ?? null;
  }
}

function writeRaw(key: string, value: string | null): void {
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch {
    if (value === null) {
      memoryStore.delete(key);
    } else {
      memoryStore.set(key, value);
    }
  }
}

// Parsed snapshots are cached by their raw string so React sees a stable value between changes.
let cachedRaw: string | null = null;
let cachedTimer: LocalTimer | null = null;

function snapshotFor(key: string): LocalTimer | null {
  const raw = readRaw(key);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedTimer = parseLocalTimer(raw);
  }
  return cachedTimer;
}

// The running timer for this user, kept in localStorage so it survives reloads and closed tabs and
// stays in step across open tabs. Null during server rendering and when no timer is running.
export function useLocalTimer(userId: string) {
  const key = storageKey(userId);
  const timer = useSyncExternalStore(
    subscribe,
    () => snapshotFor(key),
    () => null,
  );

  const save = useCallback(
    (next: LocalTimer | null) => {
      writeRaw(key, next === null ? null : JSON.stringify(next));
      window.dispatchEvent(new Event(CHANGE_EVENT));
    },
    [key],
  );

  return { timer, save };
}
