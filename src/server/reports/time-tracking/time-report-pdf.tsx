import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Document, Image, Page, Text, View, renderToBuffer } from '@react-pdf/renderer';
import { SITE } from '@/config/site';
import { formatDateKey } from '@/lib/time-tracking/date-key';
import { formatDecimalHours, formatDuration } from '@/lib/time-tracking/duration';
import { USAGE_STATUS_LABELS, UsageStatus } from '@/lib/time-tracking/usage';
import { PDF_COLORS, pdfStyles } from '@/server/reports/time-tracking/time-report-pdf-styles';
import { BreakdownKind, type ReportShareRow, type TimeReport } from '@/types/time-report';

const LOGO_PATH = path.join(process.cwd(), 'src/server/reports/assets/codeacme-logo-mark.png');
const PERCENT = 100;
const COMPANY_WEBSITE = 'codeacme.com';
const DATE_FORMAT = 'd MMM yyyy';

let logoPromise: Promise<Buffer> | null = null;
function loadLogo(): Promise<Buffer> {
  logoPromise ??= readFile(LOGO_PATH);
  return logoPromise;
}

// Branded reports use CodeAcme violet; unbranded ones are neutral ink so they read as the client's.
interface Theme {
  band: string;
  bandText: string;
  bandMuted: string;
  accent: string;
  accentWash: string;
}

const BRANDED: Theme = {
  band: PDF_COLORS.brand,
  bandText: PDF_COLORS.white,
  bandMuted: '#D9CCFB',
  accent: PDF_COLORS.brand,
  accentWash: PDF_COLORS.brandWash,
};

const UNBRANDED: Theme = {
  band: PDF_COLORS.wash,
  bandText: PDF_COLORS.ink,
  bandMuted: PDF_COLORS.muted,
  accent: PDF_COLORS.ink,
  accentWash: PDF_COLORS.wash,
};

function hours(minutes: number): string {
  return `${formatDecimalHours(minutes)} h`;
}

function percentWidth(fraction: number): `${number}%` {
  return `${Math.max(0, Math.min(1, fraction)) * PERCENT}%`;
}

function Band({
  report,
  theme,
  logo,
  preparedBy,
}: {
  report: TimeReport;
  theme: Theme;
  logo: Buffer | null;
  preparedBy: string | null;
}) {
  return (
    <View style={[pdfStyles.band, { backgroundColor: theme.band }]}>
      <View style={pdfStyles.bandTop}>
        {logo ? (
          <View style={pdfStyles.logoChip}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt attribute */}
            <Image src={{ data: logo, format: 'png' }} style={pdfStyles.logo} />
            <Text style={pdfStyles.company}>{SITE.COMPANY}</Text>
          </View>
        ) : (
          <View />
        )}
        <Text style={[pdfStyles.eyebrow, { color: theme.bandMuted }]}>Time report</Text>
      </View>
      <Text style={[pdfStyles.eyebrow, { color: theme.bandMuted }]}>{report.period.label}</Text>
      <Text style={[pdfStyles.bandTitle, { color: theme.bandText, marginTop: 4 }]}>
        {report.client.name}
      </Text>
      {report.client.contactName && (
        <Text style={[pdfStyles.bandSubtitle, { color: theme.bandMuted }]}>
          Prepared for {report.client.contactName}
        </Text>
      )}
      <View style={pdfStyles.bandMetaRow}>
        {[
          {
            label: 'Period',
            value: `${formatDateKey(report.period.startKey, 'd MMM')} – ${formatDateKey(report.period.endKey, DATE_FORMAT)}`,
          },
          { label: 'Generated', value: formatDateKey(report.generatedOn, DATE_FORMAT) },
          ...(preparedBy ? [{ label: 'Prepared by', value: preparedBy }] : []),
        ].map((item) => (
          <View key={item.label}>
            <Text style={[pdfStyles.bandMetaLabel, { color: theme.bandMuted }]}>{item.label}</Text>
            <Text style={[pdfStyles.bandMetaValue, { color: theme.bandText }]}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Kpi({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <View style={pdfStyles.kpi}>
      <Text style={pdfStyles.kpiLabel}>{label}</Text>
      <Text style={[pdfStyles.kpiValue, accent ? { color: accent } : {}]}>{value}</Text>
      {hint && <Text style={pdfStyles.kpiHint}>{hint}</Text>}
    </View>
  );
}

function Summary({ report, theme }: { report: TimeReport; theme: Theme }) {
  const daysWorked = report.days.length;
  const averageMinutes = daysWorked === 0 ? 0 : Math.round(report.totalMinutes / daysWorked);
  return (
    <View style={pdfStyles.kpiRow}>
      <Kpi
        label="Total time"
        value={hours(report.totalMinutes)}
        hint={formatDuration(report.totalMinutes)}
        accent={theme.accent}
      />
      <Kpi label="Tasks" value={String(report.entryCount)} hint="items logged" />
      <Kpi label="Days worked" value={String(daysWorked)} hint="with time logged" />
      <Kpi label="Per working day" value={hours(averageMinutes)} hint="on average" />
    </View>
  );
}

const STATUS_COLORS: Record<UsageStatus, string> = {
  [UsageStatus.NO_LIMIT]: PDF_COLORS.muted,
  [UsageStatus.WITHIN_LIMIT]: '#047857',
  [UsageStatus.NEAR_LIMIT]: '#B45309',
  [UsageStatus.LIMIT_REACHED]: '#B91C1C',
};

function UsageCard({ report, theme }: { report: TimeReport; theme: Theme }) {
  const { usage } = report;
  if (!usage || usage.limitMinutes === null) {
    return null;
  }
  const used = usage.usedMinutes / usage.limitMinutes;
  return (
    <View style={[pdfStyles.usageCard, { backgroundColor: theme.accentWash }]} wrap={false}>
      <View style={pdfStyles.usageRow}>
        <Text style={pdfStyles.usageTitle}>
          {hours(usage.usedMinutes)} of {hours(usage.limitMinutes)} monthly allowance used
        </Text>
        <Text style={[pdfStyles.usageNote, { color: STATUS_COLORS[usage.status] }]}>
          {USAGE_STATUS_LABELS[usage.status]} · {hours(usage.remainingMinutes ?? 0)} left
        </Text>
      </View>
      <View style={pdfStyles.track}>
        <View
          style={[
            pdfStyles.fill,
            { width: percentWidth(used), backgroundColor: STATUS_COLORS[usage.status] },
          ]}
        />
      </View>
    </View>
  );
}

function Bars({
  title,
  rows,
  accent,
}: {
  title: string;
  rows: { label: string; detail?: string; minutes: number; note?: string }[];
  accent: string;
}) {
  const largest = Math.max(1, ...rows.map((row) => row.minutes));
  return (
    <View wrap={false}>
      <Text style={pdfStyles.sectionTitle}>{title}</Text>
      {rows.length === 0 && <Text style={pdfStyles.entryMeta}>No time logged.</Text>}
      {rows.map((row) => (
        <View key={`${row.label}-${row.detail ?? ''}`} style={pdfStyles.barRow}>
          <View style={pdfStyles.barLabels}>
            <Text style={pdfStyles.barLabel}>
              {row.label}
              {row.detail ? <Text style={pdfStyles.barDetail}>{`  ${row.detail}`}</Text> : null}
            </Text>
            <Text style={pdfStyles.barValue}>
              {formatDecimalHours(row.minutes)} h
              {row.note ? <Text style={pdfStyles.barDetail}>{`  ${row.note}`}</Text> : null}
            </Text>
          </View>
          <View style={pdfStyles.barTrack}>
            <View
              style={[
                pdfStyles.barFill,
                { width: percentWidth(row.minutes / largest), backgroundColor: accent },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function shareRows(rows: ReportShareRow[]) {
  return rows.map((row) => ({
    label: row.label,
    minutes: row.minutes,
    note: `${Math.round(row.share * PERCENT)}%`,
  }));
}

function DayLog({ report, theme }: { report: TimeReport; theme: Theme }) {
  const showAuthor = report.byMember.length > 1;
  return (
    <View>
      <Text style={pdfStyles.sectionTitle}>Day by day</Text>
      {report.days.map((day) => (
        <View key={day.dateKey} style={pdfStyles.dayCard} wrap={false}>
          <View style={[pdfStyles.dayDate, { backgroundColor: theme.accentWash }]}>
            <Text style={[pdfStyles.dayNumber, { color: theme.accent }]}>
              {formatDateKey(day.dateKey, 'd')}
            </Text>
            <Text style={[pdfStyles.dayWeekday, { color: PDF_COLORS.muted }]}>
              {formatDateKey(day.dateKey, 'EEE MMM')}
            </Text>
            <Text style={pdfStyles.dayTotal}>{formatDuration(day.totalMinutes)}</Text>
          </View>
          <View style={pdfStyles.dayEntries}>
            {day.entries.map((entry, index) => (
              <View
                key={`${day.dateKey}-${index}`}
                style={[
                  pdfStyles.entryRow,
                  index === day.entries.length - 1 ? pdfStyles.entryRowLast : {},
                ]}
              >
                <Text
                  style={[
                    pdfStyles.durationPill,
                    { backgroundColor: theme.accentWash, color: theme.accent },
                  ]}
                >
                  {formatDuration(entry.durationMinutes)}
                </Text>
                <View style={pdfStyles.entryBody}>
                  <Text style={pdfStyles.entryTask}>{entry.task}</Text>
                  {(entry.categoryName || entry.requestedBy || showAuthor) && (
                    <Text style={pdfStyles.entryMeta}>
                      {[
                        entry.categoryName,
                        entry.requestedBy && `Requested by ${entry.requestedBy}`,
                        showAuthor && entry.userName,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
      {report.days.length === 0 && (
        <Text style={pdfStyles.entryMeta}>No time was logged in this period.</Text>
      )}
    </View>
  );
}

interface TimeReportDocumentProps {
  report: TimeReport;
  logo: Buffer | null;
  preparedBy: string | null;
}

function footerText({ report, logo, preparedBy }: TimeReportDocumentProps): string {
  const company = logo ? `${SITE.COMPANY} · ${COMPANY_WEBSITE}` : null;
  const byline = preparedBy ? `Prepared by ${preparedBy}` : null;
  return [byline, company].filter(Boolean).join(' · ') || report.client.name;
}

function TimeReportDocument({ report, logo, preparedBy }: TimeReportDocumentProps) {
  const theme = logo ? BRANDED : UNBRANDED;
  // One person's time is already the whole total, so the per-person bars would only repeat it.
  const showsMembers = report.byMember.length > 1;
  const breakdownTitle =
    report.breakdownKind === BreakdownKind.WEEK ? 'Hours by week' : 'Hours by day';
  return (
    <Document
      title={`${report.client.name} time report · ${report.period.label}`}
      author={preparedBy ?? (logo ? SITE.COMPANY : undefined)}
    >
      <Page size="A4" style={pdfStyles.page}>
        <View
          style={pdfStyles.slimHeader}
          fixed
          render={({ pageNumber }) =>
            pageNumber === 1 ? null : (
              <>
                <Text style={[pdfStyles.slimHeaderText, { color: PDF_COLORS.ink }]}>
                  {report.client.name} · {report.period.label}
                </Text>
                <Text style={pdfStyles.slimHeaderText}>
                  {logo ? `${SITE.COMPANY} · ` : ''}Page {pageNumber}
                </Text>
              </>
            )
          }
        />
        <Band report={report} theme={theme} logo={logo} preparedBy={preparedBy} />
        <Summary report={report} theme={theme} />
        <UsageCard report={report} theme={theme} />
        <View style={pdfStyles.twoColumns}>
          <View style={pdfStyles.column}>
            <Bars
              title={breakdownTitle}
              rows={report.breakdown.map((row) => ({
                label: row.label,
                detail: row.detail,
                minutes: row.minutes,
              }))}
              accent={theme.accent}
            />
          </View>
          <View style={pdfStyles.column}>
            <Bars
              title="Hours by category"
              rows={shareRows(report.byCategory)}
              accent={logo ? PDF_COLORS.brandSoft : PDF_COLORS.muted}
            />
            {showsMembers && (
              <View style={{ marginTop: 10 }}>
                <Bars
                  title="Hours by team member"
                  rows={shareRows(report.byMember)}
                  accent={logo ? PDF_COLORS.brandSoft : PDF_COLORS.muted}
                />
              </View>
            )}
          </View>
        </View>
        <DayLog report={report} theme={theme} />
        <Text style={pdfStyles.footer} fixed>
          {footerText({ report, logo, preparedBy })}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderTimeReportPdf(
  report: TimeReport,
  { branded, preparedBy }: { branded: boolean; preparedBy: string | null },
): Promise<Buffer> {
  const logo = branded ? await loadLogo() : null;
  return renderToBuffer(<TimeReportDocument report={report} logo={logo} preparedBy={preparedBy} />);
}
