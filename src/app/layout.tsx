import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { IBM_Plex_Mono, Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import { env } from '@/config/env';
import { SITE } from '@/config/site';
import './globals.css';

// The same type pair as voice.codeacme.com, so CodeAcme products read as one family.
const inter = Inter({ variable: '--font-sans-brand', subsets: ['latin'] });
const plexMono = IBM_Plex_Mono({
  variable: '--font-mono-brand',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  applicationName: SITE.NAME,
  openGraph: {
    type: 'website',
    siteName: SITE.NAME,
    title: SITE.NAME,
    description: SITE.DESCRIPTION,
  },
  twitter: { card: 'summary_large_image', title: SITE.NAME, description: SITE.DESCRIPTION },
  title: { default: SITE.NAME, template: `%s · ${SITE.NAME}` },
  description: SITE.DESCRIPTION,
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
