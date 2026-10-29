import type { EmailMessage, Mailer } from '@/server/ports/mailer.port';

export interface RecordingMailer extends Mailer {
  sent: EmailMessage[];
}

export function createRecordingMailer(): RecordingMailer {
  const sent: EmailMessage[] = [];
  return {
    sent,
    async send(message) {
      sent.push(message);
    },
  };
}

// Proves notification failures never break the operation that triggered them.
export function createFailingMailer(): Mailer {
  return {
    async send() {
      throw new Error('Mail provider is down');
    },
  };
}
