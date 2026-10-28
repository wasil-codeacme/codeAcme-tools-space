import type { RateLimitPolicy, RateLimiter } from '@/server/ports/rate-limiter.port';

const MILLISECONDS_PER_SECOND = 1000;

// Per-instance fallback for local development. On serverless every instance has its own memory,
// so production should use the Upstash adapter.
export function createMemoryRateLimiter(
  { requests, windowSeconds }: RateLimitPolicy,
  now: () => number = Date.now,
): RateLimiter {
  const attempts = new Map<string, number[]>();
  const windowMs = windowSeconds * MILLISECONDS_PER_SECOND;

  return {
    async consume(key) {
      const cutoff = now() - windowMs;
      const recent = (attempts.get(key) ?? []).filter((timestamp) => timestamp > cutoff);
      recent.push(now());
      attempts.set(key, recent);
      return recent.length <= requests;
    },
  };
}
