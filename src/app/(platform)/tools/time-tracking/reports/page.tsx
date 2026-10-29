import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PendingSection } from '@/components/platform/pending-navigation';
import { NoClientsState } from '@/components/tools/time-tracking/no-clients-state';
import { ReportFilters } from '@/components/tools/time-tracking/reports/report-filters';
import { ReportPreview } from '@/components/tools/time-tracking/reports/report-preview';
import {
  ControlsSkeleton,
  ReportPreviewSkeleton,
} from '@/components/tools/time-tracking/skeletons';
import { ReportPeriod } from '@/lib/time-tracking/report-period';
import { requireAdmin } from '@/server/auth/guards';
import { listClientsWithUsage } from '@/server/services/time-tracking/client.service';
import { buildTimeReport } from '@/server/services/time-tracking/time-report.service';
import { getTodayKey } from '@/server/time-zone';
import {
  ReportBranding,
  type ReportQuery,
  reportQuerySchema,
} from '@/server/validators/time-tracking/time-report.schema';

export const metadata: Metadata = { title: 'Time · Reports' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function ReportsContent({ searchParams }: { searchParams: SearchParams }) {
  const [actor, params, today] = await Promise.all([requireAdmin(), searchParams, getTodayKey()]);
  const clients = await listClientsWithUsage(actor, { monthKey: today, includeArchived: true });
  const firstClient = clients[0];
  if (!firstClient) {
    return <NoClientsState isAdmin />;
  }

  const parsed = reportQuerySchema.safeParse({
    clientId: firstClient.id,
    period: ReportPeriod.MONTH,
    date: today,
    branding: ReportBranding.CODEACME,
    ...params,
  });
  const query: ReportQuery = parsed.success
    ? parsed.data
    : {
        clientId: firstClient.id,
        period: ReportPeriod.MONTH,
        date: today,
        branding: ReportBranding.CODEACME,
      };
  const report = await buildTimeReport(actor, query, today);

  return (
    <div className="space-y-5">
      <ReportFilters
        clients={clients.map(({ id, name }) => ({ id, name }))}
        query={query}
        periodLabel={report.period.label}
        today={today}
        defaultPreparedBy={actor.name}
      />
      <PendingSection fallback={<ReportPreviewSkeleton />}>
        <ReportPreview report={report} branded={query.branding === ReportBranding.CODEACME} />
      </PendingSection>
    </div>
  );
}

export default function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense
      fallback={
        <div className="space-y-5">
          <ControlsSkeleton />
          <ReportPreviewSkeleton />
        </div>
      }
    >
      <ReportsContent searchParams={searchParams} />
    </Suspense>
  );
}
