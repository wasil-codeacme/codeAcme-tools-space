import type { Metadata } from 'next';
import { AuthShell } from '@/components/platform/auth-shell';
import { ForgotPasswordForm } from '@/components/platform/forgot-password-form';

export const metadata: Metadata = { title: 'Forgot password' };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      description="Enter your work email and we'll send you a link to choose a new one."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
