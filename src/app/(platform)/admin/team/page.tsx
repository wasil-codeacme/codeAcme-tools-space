import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/platform/page-header';
import { RowListSkeleton } from '@/components/platform/skeletons';
import { CreateMemberDialog } from '@/components/platform/team/create-member-dialog';
import { TeamTable } from '@/components/platform/team/team-table';
import { type ToolAccess, isToolId } from '@/config/tools';
import { requireAdmin } from '@/server/auth/guards';
import { listUsers } from '@/server/services/user.service';

export const metadata: Metadata = { title: 'Team' };

async function TeamMembers() {
  const actor = await requireAdmin();
  const users = await listUsers();
  return (
    <TeamTable
      currentUserId={actor.id}
      users={users.map(({ id, name, email, role, isActive, toolAccess }) => ({
        id,
        name,
        email,
        role,
        isActive,
        toolAccess: Object.fromEntries(
          toolAccess
            .filter((grant) => isToolId(grant.toolId))
            .map((grant) => [grant.toolId, grant.level]),
        ) as ToolAccess,
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
        description="Everyone who can sign in. Admins can use every tool; members see only the tools you give them, and only the clients they are assigned to."
        actions={<CreateMemberDialog />}
      />
      <Suspense fallback={<RowListSkeleton />}>
        <TeamMembers />
      </Suspense>
    </>
  );
}
