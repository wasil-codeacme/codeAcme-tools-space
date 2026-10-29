import 'server-only';
import { logger } from '@/lib/logger';
import type { EmailMessage, Mailer } from '@/server/ports/mailer.port';

// Local development without a Resend key: the plain-text body (with any links) goes to the log so
// flows like password reset can still be followed end to end. Never used when a key is configured.
export function createConsoleMailer(): Mailer {
  return {
    async send({ to, subject, text }: EmailMessage) {
      logger.info({ to, subject }, `Email not sent (no RESEND_API_KEY):\n${text}`);
    },
  };
}
