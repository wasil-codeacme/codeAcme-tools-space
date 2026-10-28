export interface RateLimiter {
  // Records one attempt for `key`; resolves to false once the key is over its limit.
  consume(key: string): Promise<boolean>;
}

export interface RateLimitPolicy {
  requests: number;
  windowSeconds: number;
}
