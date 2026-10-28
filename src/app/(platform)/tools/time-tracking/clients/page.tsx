import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ChevronRight } from 'lucide-react';
import { ListPageSkeleton } from '@/components/platform/skeletons';
import { ArchivedToggle } from '@/components/tools/time-tracking/clients/archived-toggle';
import { CreateClientDialog } from '@/components/tools/time-tracking/clients/create-client-dialog';
import { MonthUsageMeter } from '@/components/tools/time-tracking/month-usage-meter';
import { NoClientsState } from '@/components/tools/time-tracking/no-clients-state';
import { UsageStatusBadge } from '@/components/tools/time-tracking/usage-status-badge';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/lib/routes';
import { requireAdmin } from '@/server/auth/guards';
import { listClientsWithUsage } from '@/server/services/time-tracking/client.service';
import { getTodayKey } from '@/server/time-zone';

export const metadata: Metadata = { title: 'Time · Clients' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function ClientsContent({ searchParams }: { searchParams: SearchParams }) {
  const actor = await requireAdmin();
  const [params, today] = await Promise.all([searchParams, getTodayKey()]);
  const showArchived = params.archived === '1';
  const clients = await listClientsWithUsage(actor, {
    monthKey: today,
    includeArchived: showArchived,
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ArchivedToggle showArchived={showArchived} />
        <CreateClientDialog />
      </div>
      {clients.length === 0 ? (
        <NoClientsState isAdmin />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {clients.map((client) => (
            <li key={client.id}>
              <Link
                href={ROUTES.TOOLS.TIME_TRACKING.CLIENT(client.id)}
                className="group bg-card hover:border-primary/30 focus-visible:ring-ring/50 flex h-full flex-col gap-4 rounded-2xl border p-5 transition-[border-color,box-shadow] duration-300 outline-none hover:shadow-[0_12px_32px_-16px_color-mix(in_oklch,var(--primary)_40%,transparent)] focus-visible:ring-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-heading truncate text-lg font-semibold tracking-tight">
                      {client.name}
                    </h2>
                    <p className="text-muted-foreground truncate text-sm">
                      {client.contactName ?? 'No contact set'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {client.isArchived ? (
                      <Badge variant="outline">Archived</Badge>
                    ) : (
                      <UsageStatusBadge status={client.usage.status} />
                    )}
                    <ChevronRight className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
                <MonthUsageMeter usage={client.usage} compact />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ClientsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <ClientsContent searchParams={searchParams} />
    </Suspense>
  );
}
