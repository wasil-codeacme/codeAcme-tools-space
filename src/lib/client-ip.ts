const UNKNOWN_IP = 'unknown';

// Vercel puts the real client address first in x-forwarded-for.
export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || headers.get('x-real-ip') || UNKNOWN_IP;
}
