import { describe, expect, it } from 'vitest';
import { SESSION_MAX_AGE_SECONDS } from '@/lib/constants';
import { signSession, verifySession } from '@/lib/session';

const NOW = Date.UTC(2026, 9, 28, 12);
const MILLISECONDS_PER_SECOND = 1000;

describe('session cookies', () => {
  it('round-trips the user id and session version', async () => {
    const token = await signSession({ sub: 'user-1', ver: 3 }, NOW);
    expect(await verifySession(token, NOW)).toMatchObject({ sub: 'user-1', ver: 3 });
  });

  it('rejects a token whose payload was edited', async () => {
    const token = await signSession({ sub: 'user-1', ver: 0 }, NOW);
    const [, signature] = token.split('.');
    const forgedBody = btoa(
      JSON.stringify({ sub: 'admin', ver: 0, iat: 0, exp: 9_999_999_999 }),
    ).replace(/=+$/, '');
    expect(await verifySession(`${forgedBody}.${signature}`, NOW)).toBeNull();
  });

  it('rejects an expired token', async () => {
    const token = await signSession({ sub: 'user-1', ver: 0 }, NOW);
    const afterExpiry = NOW + (SESSION_MAX_AGE_SECONDS + 1) * MILLISECONDS_PER_SECOND;
    expect(await verifySession(token, afterExpiry)).toBeNull();
  });

  it('treats missing or malformed cookies as signed out', async () => {
    expect(await verifySession(undefined, NOW)).toBeNull();
    expect(await verifySession('not-a-token', NOW)).toBeNull();
    expect(await verifySession('%%%.###', NOW)).toBeNull();
  });
});
