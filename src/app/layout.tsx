import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Bricolage_Grotesque, Geist, Geist_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import { env } from '@/config/env';
import { SITE } from '@/config/site';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const bricolage = Bricolage_Grotesque({ variable: '--font-bricolage', subsets: ['latin'] });

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
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
