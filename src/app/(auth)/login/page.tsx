import type { Metadata } from 'next';
import Image from 'next/image';
import { LoginForm } from '@/components/platform/login-form';
import { SITE } from '@/config/site';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <main className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      <section className="bg-ledger bg-sidebar relative hidden overflow-hidden border-r lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="flex items-center gap-3">
          <Image src={SITE.LOGO_MARK} alt="" width={42} height={25} priority />
          <span className="font-heading text-lg font-semibold tracking-tight">{SITE.NAME}</span>
        </div>
        <div className="max-w-md space-y-5">
          <p className="font-figures text-muted-foreground text-xs tracking-[0.2em] uppercase">
            Internal workspace
          </p>
          <h1 className="font-heading text-5xl leading-[1.02] font-semibold tracking-tight text-balance">
            Every hour, <span className="text-brand">accounted for.</span>
          </h1>
          <p className="text-muted-foreground text-base text-pretty">
            One place for the small tools that keep client work tidy, starting with time tracking
            and clean reports for every client.
          </p>
        </div>
        <p className="text-muted-foreground text-xs">{SITE.COMPANY}</p>
        <div
          aria-hidden
          className="bg-brand/10 pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full blur-3xl"
        />
      </section>

      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <Image
              src={SITE.LOGO_MARK}
              alt=""
              width={42}
              height={25}
              className="mb-6 lg:hidden"
              priority
            />
            <h2 className="font-heading text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-muted-foreground text-sm">
              Use the email and password your admin gave you.
            </p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
