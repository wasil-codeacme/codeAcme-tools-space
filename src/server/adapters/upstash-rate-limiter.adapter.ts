import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { RateLimitPolicy, RateLimiter } from '@/server/ports/rate-limiter.port';

export function createUpstashRateLimiter(
  { url, token }: { url: string; token: string },
  prefix: string,
  { requests, windowSeconds }: RateLimitPolicy,
): RateLimiter {
  const limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
    prefix: `codeacme-tools:${prefix}`,
  });
  return {
    async consume(key) {
      const { success } = await limiter.limit(key);
      return success;
    },
  };
}
