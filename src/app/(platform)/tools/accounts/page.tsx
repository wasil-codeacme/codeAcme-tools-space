import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ListPageSkeleton } from '@/components/platform/skeletons';
import { AccountsWorkspace } from '@/components/tools/accounts/accounts-workspace';
import { ToolId } from '@/config/tools';
import { Role } from '@/generated/prisma/enums';
import { ALL_SCOPES } from '@/lib/accounts/labels';
import { requireToolAccess } from '@/server/auth/guards';
import { listAccessibleClients } from '@/server/policies/client-access.policy';
import { listAccounts } from '@/server/services/accounts/account.service';

export const metadata: Metadata = { title: 'Accounts & Secrets' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function AccountsContent({ searchParams }: { searchParams: SearchParams }) {
  const actor = await requireToolAccess(ToolId.ACCOUNTS);
  const params = await searchParams;
  const isAdmin = actor.role === Role.ADMIN;
  const showArchived = isAdmin && single(params.archived) === '1';
  const [accounts, clients] = await Promise.all([
    listAccounts(actor, { includeArchived: showArchived }),
    listAccessibleClients(actor),
  ]);

  return (
    <AccountsWorkspace
      accounts={accounts}
      clients={clients.map(({ id, name }) => ({ id, name }))}
      isAdmin={isAdmin}
      showArchived={showArchived}
      initialScope={single(params.client) ?? ALL_SCOPES}
      initialSearch={single(params.q) ?? ''}
    />
  );
}

export default function AccountsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <AccountsContent searchParams={searchParams} />
    </Suspense>
  );
}
