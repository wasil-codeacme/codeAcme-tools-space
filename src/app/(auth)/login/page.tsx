import type { Metadata } from 'next';
import { AuthShell } from '@/components/platform/auth-shell';
import { LoginForm } from '@/components/platform/login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in to CodeAcme Tools"
      description="Use the email and password your admin gave you."
    >
      <LoginForm />
      <p className="text-muted-foreground text-center text-xs">
        Accounts are created by your administrator.
      </p>
    </AuthShell>
  );
}
