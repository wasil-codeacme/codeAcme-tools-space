import type { ReactNode } from 'react';
import Image from 'next/image';
import { CircleHelp } from 'lucide-react';
import { ReportShareList } from '@/components/tools/time-tracking/reports/report-share-list';
import { UsageStatusBadge } from '@/components/tools/time-tracking/usage-status-badge';
import { SITE } from '@/config/site';
import { MESSAGES } from '@/lib/messages';
import { formatDateKey } from '@/lib/time-tracking/date-key';
import { formatDecimalHours, formatDuration } from '@/lib/time-tracking/duration';
import { cn } from '@/lib/utils';
import { BreakdownKind, type TimeReport } from '@/types/time-report';

function Stat({ label, value, hint }: { label: string; value: string; hint?: ReactNode }) {
  return (
    <div className="rounded-xl border p-3.5">
      <p className="text-muted-foreground text-[0.68rem] tracking-wider uppercase">{label}</p>
      <p className="font-figures mt-1 text-xl font-semibold">{value}</p>
      {hint && <div className="text-muted-foreground mt-0.5 text-xs">{hint}</div>}
    </div>
  );
}

function ReportHeader({ report, branded }: { report: TimeReport; branded: boolean }) {
  return (
    <header className="flex items-center justify-between border-b pb-4">
      {branded ? (
        <div className="flex items-center gap-2.5">
          <Image src={SITE.LOGO_MARK} alt="" width={34} height={20} />
          <span className="font-semibold">{SITE.COMPANY}</span>
        </div>
      ) : (
        <span className="font-semibold">{report.client.name}</span>
      )}
      <span className="text-muted-foreground text-[0.68rem] tracking-[0.2em] uppercase">
        Time report
      </span>
    </header>
  );
}

export function ReportPreview({ report, branded }: { report: TimeReport; branded: boolean }) {
  const { usage } = report;
  const showAuthor = report.byMember.length > 1;
  return (
    <div className="space-y-3">
      {report.needsReviewCount > 0 && (
        <p className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-800 dark:text-amber-200">
          <CircleHelp className="size-4 shrink-0" />
          {MESSAGES.REPORT.NEEDS_REVIEW(report.needsReviewCount)} Check them before sending.
        </p>
      )}
      <article className="bg-card mx-auto max-w-4xl space-y-6 rounded-2xl border p-4 shadow-[0_24px_60px_-30px_color-mix(in_oklch,var(--foreground)_30%,transparent)] sm:p-10">
        <ReportHeader report={report} branded={branded} />
        <div>
          <p
            className={cn(
              'text-xs font-medium tracking-[0.18em] uppercase',
              branded ? 'text-brand' : 'text-muted-foreground',
            )}
          >
            {report.period.label}
          </p>
          <h2 className="font-heading text-3xl font-semibold tracking-tight">
            {report.client.name}
          </h2>
          {report.client.contactName && (
            <p className="text-muted-foreground">For {report.client.contactName}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label="Total time"
            value={`${formatDecimalHours(report.totalMinutes)} h`}
            hint={formatDuration(report.totalMinutes)}
          />
          <Stat label="Items logged" value={String(report.entryCount)} />
          {usage && usage.limitMinutes !== null && (
            <>
              <Stat label="Monthly limit" value={`${formatDecimalHours(usage.limitMinutes)} h`} />
              <Stat
                label="Remaining"
                value={`${formatDecimalHours(usage.remainingMinutes ?? 0)} h`}
                hint={<UsageStatusBadge status={usage.status} />}
              />
            </>
          )}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <ReportShareList
            title={report.breakdownKind === BreakdownKind.WEEK ? 'Hours by week' : 'Hours by day'}
            rows={report.breakdown.map((row) => ({
              label: row.label,
              detail: row.detail,
              minutes: row.minutes,
            }))}
          />
          <ReportShareList title="Hours by category" rows={report.byCategory} />
          <ReportShareList title="Hours by team member" rows={report.byMember} />
        </div>
        <section className="space-y-3">
          <h3 className="font-heading text-base font-semibold">Day by day</h3>
          {report.days.length === 0 && (
            <p className="text-muted-foreground text-sm">No time was logged in this period.</p>
          )}
          {report.days.map((day) => (
            <div key={day.dateKey} className="overflow-hidden rounded-xl border">
              <div
                className={cn(
                  'flex justify-between px-4 py-2 text-sm font-semibold',
                  branded ? 'bg-accent' : 'bg-muted',
                )}
              >
                <span>{day.label}</span>
                <span className="font-figures">{formatDuration(day.totalMinutes)}</span>
              </div>
              <ul className="divide-y">
                {day.entries.map((entry, index) => (
                  <li key={`${day.dateKey}-${index}`} className="flex gap-4 px-4 py-2 text-sm">
                    <span className="font-figures w-14 shrink-0 font-medium">
                      {formatDuration(entry.durationMinutes)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p>{entry.task}</p>
                      <p className="text-muted-foreground text-xs">
                        {[
                          entry.categoryName,
                          entry.requestedBy && `Requested by ${entry.requestedBy}`,
                          showAuthor && entry.userName,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    {entry.needsReview && (
                      <CircleHelp
                        className="size-4 shrink-0 text-amber-600"
                        aria-label="Needs review"
                      />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
        <footer className="text-muted-foreground border-t pt-4 text-xs">
          {branded ? `Prepared by ${SITE.COMPANY} · ` : ''}Generated{' '}
          {formatDateKey(report.generatedOn, 'd MMM yyyy')}
        </footer>
      </article>
    </div>
  );
}
