'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type ParamUpdates = Record<string, string | null>;

// URL state helpers: `navigate` fetches the new server view, `replaceQuietly` only rewrites the
// address bar for state the client already has (e.g. picking another day in the loaded week).
export function useSearchParamNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function hrefWith(updates: ParamUpdates): string {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  return {
    hrefWith,
    navigate: (updates: ParamUpdates) => router.push(hrefWith(updates), { scroll: false }),
    replaceQuietly: (updates: ParamUpdates) =>
      window.history.replaceState(null, '', hrefWith(updates)),
  };
}
