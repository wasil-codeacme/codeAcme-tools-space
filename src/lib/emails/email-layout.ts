import { env } from '@/config/env';
import { SITE } from '@/config/site';

// The CodeAcme Voice email look: a white card on a soft violet canvas with a violet bar on top.
export const EMAIL_BRAND = {
  primary: '#5911eb',
  ink: '#0c0b13',
  body: '#3f3d4d',
  muted: '#6d6a7c',
  faint: '#a3a1b0',
  canvas: '#f6f5fb',
  border: '#e9e6f2',
} as const;

const EMAIL_FONT =
  "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";
const WEB_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function absoluteUrl(path: string): string {
  return new URL(path, env.NEXT_PUBLIC_APP_URL).toString();
}

export function emailButton(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" class="email-button" style="margin:26px 0 22px 0"><tr><td align="center" bgcolor="${EMAIL_BRAND.primary}" style="border-radius:12px"><a href="${escapeHtml(href)}" target="_blank" style="display:inline-block;padding:14px 30px;font-family:${EMAIL_FONT};font-size:15px;line-height:20px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px">${escapeHtml(label)}</a></td></tr></table>`;
}

export function renderEmailLayout({
  previewText,
  heading,
  bodyHtml,
}: {
  previewText: string;
  heading: string;
  bodyHtml: string;
}): string {
  const text = `font-family:${EMAIL_FONT}`;
  const logoUrl = absoluteUrl(SITE.LOGO_MARK);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light only" />
<link href="${WEB_FONTS_URL}" rel="stylesheet" />
<style>
body, table, td, div, p, a, h1, span, strong { font-family: ${EMAIL_FONT}; }
@media only screen and (max-width: 620px) {
  .email-canvas { padding: 16px 10px !important; }
  .email-pad { padding-left: 22px !important; padding-right: 22px !important; }
  .email-container { width: 100% !important; }
  .email-button { width: 100% !important; }
  .email-button a { display: block !important; box-sizing: border-box !important; text-align: center !important; }
}
</style>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.canvas};-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(previewText)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-canvas" style="background:${EMAIL_BRAND.canvas};padding:36px 14px">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" class="email-container" style="width:600px;max-width:100%;background:#ffffff;border:1px solid ${EMAIL_BRAND.border};border-radius:20px;overflow:hidden;${text}">
<tr><td style="background:${EMAIL_BRAND.primary};height:4px;line-height:4px;font-size:0">&nbsp;</td></tr>
<tr><td class="email-pad" style="padding:28px 40px 0 40px">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="vertical-align:middle"><img src="${logoUrl}" width="42" height="25" alt="CodeAcme" style="display:block;height:25px;width:auto;border:0" /></td>
<td style="vertical-align:middle;padding-left:10px"><div style="${text};font-size:16px;line-height:20px;font-weight:700;letter-spacing:-0.01em"><span style="color:${EMAIL_BRAND.ink}">CodeAcme</span> <span style="color:${EMAIL_BRAND.primary}">Tools</span></div></td>
</tr></table>
</td></tr>
<tr><td class="email-pad" style="padding:26px 40px 12px 40px">
<h1 style="margin:0 0 14px 0;${text};font-size:24px;line-height:32px;font-weight:700;color:${EMAIL_BRAND.ink};letter-spacing:-0.02em">${escapeHtml(heading)}</h1>
<div style="${text};color:${EMAIL_BRAND.body};font-size:15px;line-height:24px">${bodyHtml}</div>
</td></tr>
<tr><td class="email-pad" style="padding:22px 40px 28px 40px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${EMAIL_BRAND.border}"><tr><td style="padding-top:20px">
<div style="${text};font-size:13px;line-height:20px;color:${EMAIL_BRAND.muted}">${escapeHtml(SITE.NAME)} &middot; the CodeAcme team workspace.</div>
<div style="${text};margin-top:12px;font-size:12px;line-height:18px;color:${EMAIL_BRAND.faint}">You&#39;re receiving this because you have an account at ${escapeHtml(SITE.NAME)}.</div>
</td></tr></table>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
