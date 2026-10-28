import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { SettingsSection } from '@/components/platform/settings-section';
import { ListPageSkeleton } from '@/components/platform/skeletons';
import { CategoryManager } from '@/components/tools/time-tracking/clients/category-manager';
import { ClientArchiveButton } from '@/components/tools/time-tracking/clients/client-archive-button';
import { EditClientForm } from '@/components/tools/time-tracking/clients/edit-client-form';
import { MemberAssignments } from '@/components/tools/time-tracking/clients/member-assignments';
import { Badge } from '@/components/ui/badge';
import { requireAdmin } from '@/server/auth/guards';
import { NotFoundError } from '@/server/errors';
import { listClientMembers } from '@/server/services/time-tracking/client-member.service';
import { getClient } from '@/server/services/time-tracking/client.service';
import { listCategories } from '@/server/services/time-tracking/time-category.service';
import { listActiveUsers } from '@/server/services/user.service';
import type { SessionUser } from '@/types/auth';

export const metadata: Metadata = { title: 'Time · Client' };

type Params = Promise<{ clientId: string }>;

async function loadClient(clientId: string, actor: SessionUser) {
  try {
    return await getClient(actor, clientId);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }
}

async function ClientDetail({ params }: { params: Params }) {
  const actor = await requireAdmin();
  const { clientId } = await params;
  const client = await loadClient(clientId, actor);
  const [categories, members, users] = await Promise.all([
    listCategories([client.id], { includeArchived: true }),
    listClientMembers(client.id),
    listActiveUsers(),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">{client.name}</h2>
          {client.isArchived && <Badge variant="outline">Archived</Badge>}
        </div>
        <ClientArchiveButton clientId={client.id} isArchived={client.isArchived} />
      </div>
      <SettingsSection
        title="Details"
        description="Name, contact and the retainer cap used for limit warnings."
      >
        <EditClientForm client={client} />
      </SettingsSection>
      <SettingsSection
        title="Categories"
        description="Optional labels for entries. Reports group hours by category."
      >
        <CategoryManager clientId={client.id} categories={categories} />
      </SettingsSection>
      <SettingsSection
        title="Team"
        description="Members only see and log time for clients they are assigned to."
      >
        <MemberAssignments
          clientId={client.id}
          members={members}
          users={users.map(({ id, name, email }) => ({ id, name, email }))}
        />
      </SettingsSection>
    </div>
  );
}

export default function ClientDetailPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <ClientDetail params={params} />
    </Suspense>
  );
}
