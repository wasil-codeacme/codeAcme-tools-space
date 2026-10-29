'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

// How long the bar stays at 100% before fading, so a fast navigation still reads as "done".
const FINISH_DELAY_MS = 220;

function isInternalNavigation(event: MouseEvent): boolean {
  if (event.defaultPrevented || event.button !== 0) {
    return false;
  }
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }
  const anchor = (event.target as Element | null)?.closest('a');
  if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) {
    return false;
  }
  const url = new URL(anchor.href, window.location.href);
  const isSamePage =
    url.pathname === window.location.pathname && url.search === window.location.search;
  return url.origin === window.location.origin && !isSamePage && !url.pathname.startsWith('/api/');
}

// A thin violet bar at the top that starts the moment a link is clicked, so a click never feels
// ignored even when the server takes a moment (for example after the app has been idle).
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUrl = `${pathname}?${searchParams.toString()}`;
  // The URL a navigation started from; once the URL differs, the new page has arrived.
  const [startedFrom, setStartedFrom] = useState<string | null>(null);
  const isLoading = startedFrom !== null && startedFrom === currentUrl;
  const isDone = startedFrom !== null && startedFrom !== currentUrl;

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (isInternalNavigation(event)) {
        setStartedFrom(`${window.location.pathname}?${window.location.search.slice(1)}`);
      }
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  useEffect(() => {
    if (!isDone) {
      return;
    }
    const timer = window.setTimeout(() => setStartedFrom(null), FINISH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isDone]);

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden transition-opacity duration-300',
        isLoading || isDone ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div
        className={cn(
          'bg-primary h-full shadow-[0_0_8px_var(--primary)] transition-[width] ease-out',
          !isLoading && !isDone && 'w-0 duration-0',
          isLoading && 'w-[85%] duration-[2500ms]',
          isDone && 'w-full duration-200',
        )}
      />
    </div>
  );
}
