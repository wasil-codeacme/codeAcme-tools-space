import { formatDecimalHours } from '@/lib/time-tracking/duration';

const PERCENT = 100;

interface ShareListRow {
  label: string;
  minutes: number;
  detail?: string;
  share?: number;
}

export function ReportShareList({ title, rows }: { title: string; rows: ShareListRow[] }) {
  const largest = Math.max(1, ...rows.map((row) => row.minutes));
  return (
    <section className="space-y-2">
      <h3 className="font-heading text-base font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">No time logged.</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((row) => (
            <li key={`${row.label}-${row.detail ?? ''}`} className="space-y-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">
                  {row.label}
                  {row.detail && (
                    <span className="text-muted-foreground ml-2 text-xs">{row.detail}</span>
                  )}
                </span>
                <span className="font-figures shrink-0">
                  {formatDecimalHours(row.minutes)}
                  {row.share !== undefined && (
                    <span className="text-muted-foreground ml-2 text-xs">
                      {Math.round(row.share * PERCENT)}%
                    </span>
                  )}
                </span>
              </div>
              <div className="bg-muted h-1 overflow-hidden rounded-full">
                <div
                  className="bg-primary/70 h-full rounded-full"
                  style={{ width: `${(row.minutes / largest) * PERCENT}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
