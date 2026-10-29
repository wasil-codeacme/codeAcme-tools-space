import type { ReactNode } from 'react';
import Image from 'next/image';
import { Check, ShieldCheck } from 'lucide-react';
import { SITE } from '@/config/site';

const HIGHLIGHTS = [
  {
    title: 'Every hour, accounted for',
    detail: 'Log client work in seconds and see the month at a glance.',
  },
  { title: 'Client-ready reports', detail: 'Clean PDF and CSV exports, branded or plain.' },
  {
    title: 'Access kept tidy',
    detail: 'Accounts and secrets per client, with every reveal logged.',
  },
] as const;

function BrandPanel() {
  return (
    <section className="relative isolate hidden overflow-hidden px-14 py-14 lg:flex lg:flex-col lg:justify-between">
      <div aria-hidden className="bg-ledger absolute inset-0 -z-20" />
      <div
        aria-hidden
        className="ca-hue-a absolute -top-40 -left-24 -z-10 h-[34rem] w-[34rem] rounded-full opacity-70 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(89,17,235,0.28), rgba(89,17,235,0) 62%)',
        }}
      />
      <div
        aria-hidden
        className="ca-hue-b absolute -right-32 bottom-[-12rem] -z-10 h-[30rem] w-[30rem] rounded-full opacity-60 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(138,92,244,0.26), rgba(138,92,244,0) 62%)',
        }}
      />

      <div className="flex items-center gap-3">
        <Image src={SITE.LOGO_MARK} alt="" width={42} height={25} className="h-auto" priority />
        <span className="text-lg font-bold tracking-[-0.01em]">{SITE.NAME}</span>
      </div>

      <div className="max-w-lg space-y-6">
        <p className="ca-eyebrow text-primary flex items-center gap-2.5">
          <span aria-hidden className="h-0.5 w-[18px] bg-current opacity-50" />
          Internal tools
        </p>
        <h1 className="text-5xl leading-[1.04] font-bold tracking-[-0.03em] text-balance">
          The team&apos;s workspace,{' '}
          <span className="text-primary relative whitespace-nowrap">
            all in one place.
            <span
              aria-hidden
              className="bg-primary/30 absolute right-0 -bottom-1 left-0 h-[3px] rounded-full"
            />
          </span>
        </h1>
        <ul className="space-y-4">
          {HIGHLIGHTS.map((highlight) => (
            <li key={highlight.title} className="flex gap-3">
              <span className="bg-accent text-primary mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                <Check className="size-3" strokeWidth={3} />
              </span>
              <span>
                <span className="block text-sm font-medium">{highlight.title}</span>
                <span className="text-muted-foreground block text-sm">{highlight.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-muted-foreground flex items-center gap-2 text-xs">
        <ShieldCheck className="size-3.5" />
        Secrets are encrypted at rest and every reveal is logged.
      </p>
    </section>
  );
}

// The split sign-in layout shared by every signed-out page, matching voice.codeacme.com.
export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_0.95fr]">
      <BrandPanel />
      <section className="bg-card flex items-center justify-center p-6 sm:p-12 lg:border-l">
        <div className="w-full max-w-sm space-y-7">
          <Image
            src={SITE.LOGO_MARK}
            alt=""
            width={42}
            height={25}
            className="h-auto lg:hidden"
            priority
          />
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-[-0.01em]">{title}</h2>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
