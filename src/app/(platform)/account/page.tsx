import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ChangePasswordForm } from '@/components/platform/change-password-form';
import { PageHeader } from '@/components/platform/page-header';
import { SettingsSection } from '@/components/platform/settings-section';
import { ListPageSkeleton } from '@/components/platform/skeletons';
import { ROLE_LABELS } from '@/components/platform/team/role-select';
import { requireUser } from '@/server/auth/guards';

export const metadata: Metadata = { title: 'Account' };

async function AccountContent() {
  const user = await requireUser();
  return (
    <>
      <PageHeader eyebrow="Account" title={user.name} description={user.email} />
      <div className="space-y-5">
        <SettingsSection
          title="Profile"
          description="Ask an admin if your name or email needs to change."
        >
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{user.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Role</dt>
              <dd className="font-medium">{ROLE_LABELS[user.role]}</dd>
            </div>
          </dl>
        </SettingsSection>
        <SettingsSection
          title="Password"
          description="Changing it signs you out on every other device."
        >
          <ChangePasswordForm />
        </SettingsSection>
      </div>
    </>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <AccountContent />
    </Suspense>
  );
}
