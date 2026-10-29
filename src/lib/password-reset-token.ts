import { createHash, randomBytes } from 'node:crypto';

const TOKEN_BYTES = 32;

// 256 bits of randomness, URL-safe so it can sit in a query string unescaped.
export function generateResetToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

// Only this hash is stored; the raw token exists solely in the email link.
export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
