import { PASSWORD_RESET_TTL_MINUTES } from '@/lib/constants';
import {
  type RenderedEmail,
  absoluteUrl,
  emailButton,
  escapeHtml,
  renderEmailLayout,
} from '@/lib/emails/email-layout';
import { ROUTES } from '@/lib/routes';

function firstName(name: string): string {
  return name.split(' ')[0] || name;
}

export function passwordResetEmail({
  name,
  token,
}: {
  name: string;
  token: string;
}): RenderedEmail {
  const resetUrl = absoluteUrl(`${ROUTES.AUTH.RESET_PASSWORD}?token=${encodeURIComponent(token)}`);
  const greeting = `Hi ${escapeHtml(firstName(name))},`;
  return {
    subject: 'Reset your CodeAcme Tools password',
    html: renderEmailLayout({
      previewText: 'Use this link to choose a new password.',
      heading: 'Reset your password',
      bodyHtml: `<p style="margin:0 0 12px 0">${greeting}</p><p style="margin:0">Someone asked to reset the password for your CodeAcme Tools account. Choose a new one with the button below. The link works once and expires in ${PASSWORD_RESET_TTL_MINUTES} minutes.</p>${emailButton('Choose a new password', resetUrl)}<p style="margin:0;font-size:13px;color:#6d6a7c">Didn&#39;t ask for this? Ignore this email and your password stays the same.</p>`,
    }),
    text: `Hi ${firstName(name)},\n\nReset your CodeAcme Tools password (works once, expires in ${PASSWORD_RESET_TTL_MINUTES} minutes):\n${resetUrl}\n\nDidn't ask for this? Ignore this email and your password stays the same.`,
  };
}

export function passwordChangedEmail({ name }: { name: string }): RenderedEmail {
  const signInUrl = absoluteUrl(ROUTES.AUTH.LOGIN);
  const resetUrl = absoluteUrl(ROUTES.AUTH.FORGOT_PASSWORD);
  return {
    subject: 'Your CodeAcme Tools password was changed',
    html: renderEmailLayout({
      previewText: 'Your password was just changed.',
      heading: 'Your password was changed',
      bodyHtml: `<p style="margin:0 0 12px 0">Hi ${escapeHtml(firstName(name))},</p><p style="margin:0">The password for your CodeAcme Tools account was just changed, and every other signed-in device was signed out.</p>${emailButton('Sign in', signInUrl)}<p style="margin:0;font-size:13px;color:#6d6a7c">Wasn&#39;t you? <a href="${escapeHtml(resetUrl)}" style="color:#5911eb;font-weight:600;text-decoration:none">Reset your password</a> now and tell your admin.</p>`,
    }),
    text: `Hi ${firstName(name)},\n\nThe password for your CodeAcme Tools account was just changed, and other devices were signed out.\n\nWasn't you? Reset it now: ${resetUrl}`,
  };
}

export function welcomeEmail({
  name,
  email,
  temporaryPassword,
}: {
  name: string;
  email: string;
  temporaryPassword: string;
}): RenderedEmail {
  const signInUrl = absoluteUrl(ROUTES.AUTH.LOGIN);
  return {
    subject: 'Your CodeAcme Tools account is ready',
    html: renderEmailLayout({
      previewText: 'Sign in to the CodeAcme team workspace.',
      heading: `Welcome, ${firstName(name)}`,
      bodyHtml: `<p style="margin:0 0 12px 0">An account was created for you at CodeAcme Tools, the team workspace for time tracking, client accounts and reports.</p><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:18px 0 0 0;background:#f7f4ff;border:1px solid #e7dffd;border-radius:12px"><tr><td style="padding:14px 18px;font-size:14px;line-height:22px"><div><strong>Email:</strong> ${escapeHtml(email)}</div><div><strong>Temporary password:</strong> <span style="font-family:'IBM Plex Mono',ui-monospace,monospace">${escapeHtml(temporaryPassword)}</span></div></td></tr></table>${emailButton('Sign in', signInUrl)}<p style="margin:0;font-size:13px;color:#6d6a7c">Change the temporary password from your Account page after signing in.</p>`,
    }),
    text: `Welcome, ${firstName(name)}.\n\nSign in at ${signInUrl}\nEmail: ${email}\nTemporary password: ${temporaryPassword}\n\nChange it from your Account page after signing in.`,
  };
}
