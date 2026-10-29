import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PendingSection } from '@/components/platform/pending-navigation';
import { NoClientsState } from '@/components/tools/time-tracking/no-clients-state';
import { ReportFilters } from '@/components/tools/time-tracking/reports/report-filters';
import { ReportPdfPreview } from '@/components/tools/time-tracking/reports/report-pdf-preview';
import {
  ControlsSkeleton,
  ReportPreviewSkeleton,
} from '@/components/tools/time-tracking/skeletons';
import { ROUTES } from '@/lib/routes';
import { ReportPeriod } from '@/lib/time-tracking/report-period';
import { requireAdmin } from '@/server/auth/guards';
import { listClientsWithUsage } from '@/server/services/time-tracking/client.service';
import { buildTimeReport } from '@/server/services/time-tracking/time-report.service';
import { getTodayKey } from '@/server/time-zone';
import {
  ReportBranding,
  ReportFormat,
  type ReportQuery,
  reportQuerySchema,
} from '@/server/validators/time-tracking/time-report.schema';

export const metadata: Metadata = { title: 'Time · Reports' };

function previewHref(query: ReportQuery, preparedBy: string): string {
  const params = new URLSearchParams({
    clientId: query.clientId,
    period: query.period,
    date: query.date,
    branding: query.branding,
    format: ReportFormat.PDF,
    preparedBy,
    inline: '1',
  });
  if (query.to) {
    params.set('to', query.to);
  }
  return `${ROUTES.API.TIME_TRACKING.REPORT_EXPORT}?${params.toString()}`;
}

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
        <ReportPdfPreview
          pdfHref={previewHref(query, actor.name)}
          title={`${report.client.name} time report · ${report.period.label}`}
          needsReviewCount={report.needsReviewCount}
        />
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
