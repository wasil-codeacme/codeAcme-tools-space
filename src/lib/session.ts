import { env } from '@/config/env';
import { SESSION_MAX_AGE_SECONDS } from '@/lib/constants';
import type { SessionPayload } from '@/types/auth';

// Dependency-free signed session cookie (HMAC-SHA256 over a base64url JSON body). Uses Web Crypto so
// the same code verifies in the proxy and in server components. The payload carries only the user id
// and session version; role and status are always read live from the database.

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const MILLISECONDS_PER_SECOND = 1000;

function bytesToBase64url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function importKey(usage: KeyUsage): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(env.AUTH_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage],
  );
}

async function sign(data: string): Promise<string> {
  const key = await importKey('sign');
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return bytesToBase64url(new Uint8Array(signature));
}

function isValidPayload(payload: unknown, nowSeconds: number): payload is SessionPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }
  const candidate = payload as Record<string, unknown>;
  return (
    typeof candidate.sub === 'string' &&
    typeof candidate.ver === 'number' &&
    typeof candidate.iat === 'number' &&
    typeof candidate.exp === 'number' &&
    candidate.exp >= nowSeconds
  );
}

export async function signSession(
  { sub, ver }: Pick<SessionPayload, 'sub' | 'ver'>,
  now = Date.now(),
): Promise<string> {
  const issuedAt = Math.floor(now / MILLISECONDS_PER_SECOND);
  const body: SessionPayload = { sub, ver, iat: issuedAt, exp: issuedAt + SESSION_MAX_AGE_SECONDS };
  const encoded = bytesToBase64url(encoder.encode(JSON.stringify(body)));
  return `${encoded}.${await sign(encoded)}`;
}

export async function verifySession(
  token: string | undefined,
  now = Date.now(),
): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) {
    return null;
  }

  try {
    const key = await importKey('verify');
    const isAuthentic = await crypto.subtle.verify(
      'HMAC',
      key,
      base64urlToBytes(signature),
      encoder.encode(encoded),
    );
    if (!isAuthentic) {
      return null;
    }
    const payload: unknown = JSON.parse(decoder.decode(base64urlToBytes(encoded)));
    return isValidPayload(payload, Math.floor(now / MILLISECONDS_PER_SECOND)) ? payload : null;
  } catch {
    // Malformed base64 or JSON means a forged or corrupted cookie: treat as signed out.
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  } as const;
}
