import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/platform/page-header';
import { RowListSkeleton } from '@/components/platform/skeletons';
import { CreateMemberDialog } from '@/components/platform/team/create-member-dialog';
import { TeamTable } from '@/components/platform/team/team-table';
import { requireAdmin } from '@/server/auth/guards';
import { listUsers } from '@/server/services/user.service';

export const metadata: Metadata = { title: 'Team' };

async function TeamMembers() {
  const actor = await requireAdmin();
  const users = await listUsers();
  return (
    <TeamTable
      currentUserId={actor.id}
      users={users.map(({ id, name, email, role, isActive }) => ({
        id,
        name,
        email,
        role,
        isActive,
      }))}
    />
  );
}

export default function TeamPage() {
  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Team"
        description="Everyone who can sign in. Admins manage clients, reports and the team; members log time for the clients they are assigned to."
        actions={<CreateMemberDialog />}
      />
      <Suspense fallback={<RowListSkeleton />}>
        <TeamMembers />
      </Suspense>
    </>
  );
}
