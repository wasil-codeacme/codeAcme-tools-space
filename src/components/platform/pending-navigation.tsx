'use client';

import {
  type ReactNode,
  type TransitionStartFunction,
  createContext,
  use,
  useTransition,
} from 'react';

interface PendingNavigation {
  isPending: boolean;
  startTransition: TransitionStartFunction;
}

const PendingNavigationContext = createContext<PendingNavigation | null>(null);

// Filter changes (week, client, period…) run as one shared transition so the controls stay
// interactive while only the sections whose data is reloading show a skeleton.
export function PendingNavigationProvider({ children }: { children: ReactNode }) {
  const [isPending, startTransition] = useTransition();
  return (
    <PendingNavigationContext value={{ isPending, startTransition }}>
      {children}
    </PendingNavigationContext>
  );
}

export function usePendingNavigation(): PendingNavigation {
  const context = use(PendingNavigationContext);
  if (!context) {
    throw new Error('usePendingNavigation must be used inside PendingNavigationProvider');
  }
  return context;
}

// Wraps a section whose data comes from the URL. While new data loads, the old content stays
// mounted (so in-progress edits survive) but hidden, and the matching skeleton shows instead.
export function PendingSection({
  fallback,
  children,
}: {
  fallback: ReactNode;
  children: ReactNode;
}) {
  const { isPending } = usePendingNavigation();
  return (
    <>
      <div hidden={isPending} className="contents">
        {children}
      </div>
      {isPending && <div aria-busy="true">{fallback}</div>}
    </>
  );
}
