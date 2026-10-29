import 'server-only';
import type { EmailMessage, Mailer } from '@/server/ports/mailer.port';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const ERROR_BODY_PREVIEW_LENGTH = 300;

// Plain fetch keeps the provider SDK out of the bundle; Resend's API is a single POST.
export function createResendMailer({ apiKey, from }: { apiKey: string; from: string }): Mailer {
  return {
    async send({ to, subject, html, text }: EmailMessage) {
      const response = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], subject, html, text }),
      });
      if (!response.ok) {
        const body = (await response.text()).slice(0, ERROR_BODY_PREVIEW_LENGTH);
        throw new Error(`Resend rejected the email (${response.status}): ${body}`);
      }
    },
  };
}
