import { describe, expect, it } from 'vitest';
import { createMemoryRateLimiter } from '@/server/adapters/memory-rate-limiter.adapter';

describe('memory rate limiter', () => {
  it('allows the configured number of attempts per window, then blocks', async () => {
    let now = 0;
    const limiter = createMemoryRateLimiter({ requests: 2, windowSeconds: 60 }, () => now);

    expect(await limiter.consume('ip')).toBe(true);
    expect(await limiter.consume('ip')).toBe(true);
    expect(await limiter.consume('ip')).toBe(false);
    expect(await limiter.consume('other-ip')).toBe(true);

    now = 61_000;
    expect(await limiter.consume('ip')).toBe(true);
  });
});
