'use client';

import { useEffect, useEffectEvent } from 'react';

type ShortcutMap = Record<string, () => void>;

const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return TYPING_TAGS.has(target.tagName) || target.isContentEditable;
}

// Single-key shortcuts that never fire while the user is typing, holding a modifier or in a dialog.
export function useKeyboardShortcuts(shortcuts: ShortcutMap): void {
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) {
      return;
    }
    if (document.querySelector('[role="dialog"]')) {
      return;
    }
    const handler = shortcuts[event.key];
    if (handler) {
      event.preventDefault();
      handler();
    }
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => handleKeyDown(event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);
}
