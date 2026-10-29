import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { AuthShell } from '@/components/platform/auth-shell';
import { ResetPasswordForm } from '@/components/platform/reset-password-form';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = { title: 'Choose a new password' };

async function ResetPasswordContent({ searchParams }: PageProps<'/reset-password'>) {
  const { token } = await searchParams;
  if (typeof token !== 'string' || token.length === 0) {
    return (
      <Button variant="outline" className="w-full" asChild>
        <Link href={ROUTES.AUTH.FORGOT_PASSWORD}>Request a new reset link</Link>
      </Button>
    );
  }
  return <ResetPasswordForm token={token} />;
}

export default function ResetPasswordPage(props: PageProps<'/reset-password'>) {
  return (
    <AuthShell
      title="Choose a new password"
      description="Use at least 12 characters. Every other device will be signed out."
    >
      <Suspense>
        <ResetPasswordContent {...props} />
      </Suspense>
    </AuthShell>
  );
}
