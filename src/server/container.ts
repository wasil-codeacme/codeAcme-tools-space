import 'server-only';
import { env } from '@/config/env';
import { LOGIN_RATE_LIMIT } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { createMemoryRateLimiter } from '@/server/adapters/memory-rate-limiter.adapter';
import { createUpstashRateLimiter } from '@/server/adapters/upstash-rate-limiter.adapter';
import type { RateLimiter } from '@/server/ports/rate-limiter.port';

// Composition root: the only place that decides which adapter backs each port.

function buildLoginRateLimiter(): RateLimiter {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return createUpstashRateLimiter(
      { url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN },
      'login',
      LOGIN_RATE_LIMIT,
    );
  }
  if (env.NODE_ENV === 'production') {
    logger.warn('Upstash is not configured; login rate limiting is per-instance only');
  }
  return createMemoryRateLimiter(LOGIN_RATE_LIMIT);
}

export const loginRateLimiter = buildLoginRateLimiter();
