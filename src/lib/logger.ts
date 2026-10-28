import pino from 'pino';
import { env } from '@/config/env';

const isDevelopment = env.NODE_ENV === 'development';

export const logger = pino({
  level: env.LOG_LEVEL ?? (isDevelopment ? 'debug' : 'info'),
  redact: {
    paths: [
      'password',
      '*.password',
      'passwordHash',
      '*.passwordHash',
      'email',
      '*.email',
      'token',
      'secret',
      '*.secret',
      'secureNotes',
      '*.secureNotes',
    ],
    censor: '[redacted]',
  },
  ...(isDevelopment && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});
