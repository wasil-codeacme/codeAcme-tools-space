import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const MIN_AUTH_SECRET_LENGTH = 32;
const ENCRYPTION_KEY_BYTES = 32;

// Base64 of exactly 32 random bytes: `openssl rand -base64 32`.
const encryptionKeySchema = z
  .string()
  .refine((value) => Buffer.from(value, 'base64').length === ENCRYPTION_KEY_BYTES, {
    message: 'Must be base64 encoding exactly 32 bytes',
  });

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.url(),
    AUTH_SECRET: z.string().min(MIN_AUTH_SECRET_LENGTH),
    SECRETS_ENCRYPTION_KEY: encryptionKeySchema,
    // Optional: without Upstash the login limiter falls back to per-instance memory.
    UPSTASH_REDIS_REST_URL: z.url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']).optional(),
    // Optional: without a Resend key, emails are written to the server log instead of sent.
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).default('CodeAcme Tools <noreply@codeacme.com>'),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    SECRETS_ENCRYPTION_KEY: process.env.SECRETS_ENCRYPTION_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    LOG_LEVEL: process.env.LOG_LEVEL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  // CI builds and lints without real secrets; runtime still validates.
  skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
  emptyStringAsUndefined: true,
});
