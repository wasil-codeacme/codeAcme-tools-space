import 'server-only';
import { env } from '@/config/env';
import { LOGIN_RATE_LIMIT } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { createConsoleMailer } from '@/server/adapters/console-mailer.adapter';
import { createMemoryRateLimiter } from '@/server/adapters/memory-rate-limiter.adapter';
import { createResendMailer } from '@/server/adapters/resend-mailer.adapter';
import { createUpstashRateLimiter } from '@/server/adapters/upstash-rate-limiter.adapter';
import type { Mailer } from '@/server/ports/mailer.port';
import type { RateLimiter } from '@/server/ports/rate-limiter.port';

// Composition root: the only place that decides which adapter backs each port.

function buildRateLimiter(prefix: string): RateLimiter {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return createUpstashRateLimiter(
      { url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN },
      prefix,
      LOGIN_RATE_LIMIT,
    );
  }
  if (env.NODE_ENV === 'production') {
    logger.warn({ prefix }, 'Upstash is not configured; rate limiting is per-instance only');
  }
  return createMemoryRateLimiter(LOGIN_RATE_LIMIT);
}

function buildMailer(): Mailer {
  if (env.RESEND_API_KEY) {
    return createResendMailer({ apiKey: env.RESEND_API_KEY, from: env.EMAIL_FROM });
  }
  if (env.NODE_ENV === 'production') {
    logger.error('RESEND_API_KEY is not set; emails are logged instead of sent');
  }
  return createConsoleMailer();
}

export const loginRateLimiter = buildRateLimiter('login');
// Separate bucket so password-reset requests cannot be used to lock someone out of signing in.
export const passwordResetRateLimiter = buildRateLimiter('password-reset');
export const mailer = buildMailer();
