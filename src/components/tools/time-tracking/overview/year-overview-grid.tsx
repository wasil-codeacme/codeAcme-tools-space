import Link from 'next/link';
import { UsageStatusBadge } from '@/components/tools/time-tracking/usage-status-badge';
import { MAX_WEEKS_IN_MONTH } from '@/lib/constants';
import { ROUTES } from '@/lib/routes';
import { formatDateKey } from '@/lib/time-tracking/date-key';
import { formatDecimalHours, formatDuration } from '@/lib/time-tracking/duration';
import { cn } from '@/lib/utils';
import type { OverviewMonthRow, OverviewWeekCell, YearOverview } from '@/types/time-tracking';

interface YearOverviewGridProps {
  overview: YearOverview;
  clientId: string;
  clientName: string;
  hasLimit: boolean;
  currentMonthKey: string;
}

const WEEK_COLUMNS = Array.from({ length: MAX_WEEKS_IN_MONTH }, (_, index) => index + 1);
const HEAT_STEPS = [0.06, 0.12, 0.2, 0.3] as const;
const FULL_PERCENT = 100;

function heatOpacity(minutes: number, busiest: number): number {
  if (minutes === 0 || busiest === 0) {
    return 0;
  }
  const step = Math.min(HEAT_STEPS.length - 1, Math.floor((minutes / busiest) * HEAT_STEPS.length));
  return HEAT_STEPS[step] ?? 0;
}

interface WeekLinkProps {
  week: OverviewWeekCell;
  clientId: string;
  busiest: number;
}

function WeekLink({ week, clientId, busiest }: WeekLinkProps) {
  const opacity = heatOpacity(week.minutes, busiest);
  return (
    <Link
      href={`${ROUTES.TOOLS.TIME_TRACKING.ROOT}?client=${clientId}&date=${week.startKey}`}
      title={`${week.rangeLabel}: ${formatDuration(week.minutes)}`}
      style={
        opacity > 0
          ? {
              backgroundColor: `color-mix(in oklch, var(--primary) ${opacity * 100}%, transparent)`,
            }
          : undefined
      }
      className="hover:ring-primary/40 focus-visible:ring-ring/50 max-md:bg-muted/40 flex w-full flex-col items-end rounded-lg px-2.5 py-1.5 transition-shadow outline-none hover:ring-2 focus-visible:ring-3 max-md:items-start"
    >
      <span
        className={cn('font-figures text-sm', week.minutes === 0 && 'text-muted-foreground/50')}
      >
        {week.minutes === 0 ? '—' : formatDecimalHours(week.minutes)}
      </span>
      <span className="text-muted-foreground text-[0.65rem]">
        <span className="md:hidden">W{week.index} · </span>
        {week.rangeLabel}
      </span>
    </Link>
  );
}

function WeekCell(props: WeekLinkProps) {
  return (
    <td className="p-1">
      <WeekLink {...props} />
    </td>
  );
}

interface MonthRowProps {
  month: OverviewMonthRow;
  clientId: string;
  hasLimit: boolean;
  isCurrent: boolean;
  busiest: number;
}

function MonthRow({ month, clientId, hasLimit, isCurrent, busiest }: MonthRowProps) {
  return (
    <tr className={cn('border-t', isCurrent && 'bg-accent/40')}>
      <th scope="row" className="px-4 py-2 text-left text-sm font-medium whitespace-nowrap">
        {month.label}
        {isCurrent && (
          <span className="bg-primary ml-2 inline-block size-1.5 rounded-full align-middle" />
        )}
      </th>
      {WEEK_COLUMNS.map((index) => {
        const week = month.weeks[index - 1];
        return week ? (
          <WeekCell key={index} week={week} clientId={clientId} busiest={busiest} />
        ) : (
          <td key={index} />
        );
      })}
      <td className="font-figures px-4 py-2 text-right text-sm font-semibold">
        {formatDecimalHours(month.usage.usedMinutes)}
        {hasLimit && month.usage.limitMinutes ? (
          <span
            aria-hidden
            className="bg-muted mt-1 ml-auto block h-1 w-14 overflow-hidden rounded-full"
          >
            <span
              className="bg-primary block h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${Math.min(FULL_PERCENT, (month.usage.usedMinutes / month.usage.limitMinutes) * FULL_PERCENT)}%`,
              }}
            />
          </span>
        ) : null}
      </td>
      {hasLimit && (
        <>
          <td className="font-figures text-muted-foreground px-4 py-2 text-right text-sm">
            {formatDecimalHours(month.usage.limitMinutes ?? 0)}
          </td>
          <td className="font-figures px-4 py-2 text-right text-sm">
            {formatDecimalHours(month.usage.remainingMinutes ?? 0)}
          </td>
          <td className="px-4 py-2">
            <UsageStatusBadge status={month.usage.status} />
          </td>
        </>
      )}
    </tr>
  );
}

// Phones get one card per month with the weeks as a wrapping grid instead of a wide table.
function MonthCard({ month, clientId, hasLimit, isCurrent, busiest }: MonthRowProps) {
  return (
    <li className={cn('space-y-2.5 px-4 py-3.5', isCurrent && 'bg-accent/40')}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold whitespace-nowrap">
          {formatDateKey(month.monthKey, 'MMM yyyy')}
          {isCurrent && (
            <span className="bg-primary ml-2 inline-block size-1.5 rounded-full align-middle" />
          )}
        </p>
        <div className="flex items-center gap-2">
          <span className="font-figures text-sm font-semibold whitespace-nowrap">
            {formatDecimalHours(month.usage.usedMinutes)}
            {hasLimit && (
              <span className="text-muted-foreground font-normal">
                {' '}
                / {formatDecimalHours(month.usage.limitMinutes ?? 0)}
              </span>
            )}
          </span>
          {hasLimit && <UsageStatusBadge status={month.usage.status} />}
        </div>
      </div>
      <ul className="grid grid-cols-3 gap-1">
        {month.weeks.map((week) => (
          <li key={week.index} className="flex">
            <WeekLink week={week} clientId={clientId} busiest={busiest} />
          </li>
        ))}
      </ul>
    </li>
  );
}

export function YearOverviewGrid({
  overview,
  clientId,
  clientName,
  hasLimit,
  currentMonthKey,
}: YearOverviewGridProps) {
  const busiest = Math.max(
    0,
    ...overview.months.flatMap((month) => month.weeks.map((week) => week.minutes)),
  );

  return (
    <section className="ca-glow bg-card overflow-hidden rounded-2xl border">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b px-5 py-4">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            {clientName} · {overview.year}
          </h2>
          <p className="text-muted-foreground text-xs">
            Hours per week (Monday–Sunday, cut at month ends). Click a week to open it in the log.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div
            aria-hidden
            className="text-muted-foreground hidden items-center gap-1 text-[0.65rem] sm:flex"
          >
            Less
            {HEAT_STEPS.map((opacity) => (
              <span
                key={opacity}
                className="size-3 rounded-[3px]"
                style={{
                  backgroundColor: `color-mix(in oklab, var(--primary) ${opacity * FULL_PERCENT}%, transparent)`,
                }}
              />
            ))}
            More
          </div>
          <p className="font-figures text-muted-foreground text-sm">
            Year total{' '}
            <span className="text-foreground text-lg font-semibold">
              {formatDecimalHours(overview.totalMinutes)} h
            </span>
          </p>
        </div>
      </header>
      <ul className="divide-y md:hidden">
        {overview.months.map((month) => (
          <MonthCard
            key={month.monthKey}
            month={month}
            clientId={clientId}
            hasLimit={hasLimit}
            isCurrent={month.monthKey === currentMonthKey}
            busiest={busiest}
          />
        ))}
      </ul>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="text-muted-foreground text-[0.7rem] tracking-wider uppercase">
              <th className="px-4 py-2.5 text-left font-medium">Month</th>
              {WEEK_COLUMNS.map((index) => (
                <th key={index} className="px-2 py-2.5 text-right font-medium">
                  Week {index}
                </th>
              ))}
              <th className="px-4 py-2.5 text-right font-medium">Total</th>
              {hasLimit && (
                <>
                  <th className="px-4 py-2.5 text-right font-medium">Limit</th>
                  <th className="px-4 py-2.5 text-right font-medium">Remaining</th>
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {overview.months.map((month) => (
              <MonthRow
                key={month.monthKey}
                month={month}
                clientId={clientId}
                hasLimit={hasLimit}
                isCurrent={month.monthKey === currentMonthKey}
                busiest={busiest}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
