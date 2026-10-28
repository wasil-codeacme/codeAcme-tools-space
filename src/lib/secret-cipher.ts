import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { env } from '@/config/env';

// AES-256-GCM: authenticated, so a tampered ciphertext fails to decrypt instead of returning junk.
// The version prefix leaves room to rotate the key later without guessing which key wrote a value.
const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v1';
const IV_BYTES = 12;
const SEPARATOR = '.';

function key(): Buffer {
  return Buffer.from(env.SECRETS_ENCRYPTION_KEY, 'base64');
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key(), iv);
  const data = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return [VERSION, iv, cipher.getAuthTag(), data]
    .map((part) => (typeof part === 'string' ? part : part.toString('base64url')))
    .join(SEPARATOR);
}

export function decryptSecret(stored: string): string {
  const [version, iv, tag, data] = stored.split(SEPARATOR);
  if (version !== VERSION || !iv || !tag || data === undefined) {
    throw new Error('Unsupported secret format');
  }
  const decipher = createDecipheriv(ALGORITHM, key(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(data, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
