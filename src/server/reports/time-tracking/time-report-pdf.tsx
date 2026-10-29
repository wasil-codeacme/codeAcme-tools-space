import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Document, Image, Page, Text, View, renderToBuffer } from '@react-pdf/renderer';
import { SITE } from '@/config/site';
import { formatDateKey } from '@/lib/time-tracking/date-key';
import { formatDecimalHours, formatDuration } from '@/lib/time-tracking/duration';
import { USAGE_STATUS_LABELS } from '@/lib/time-tracking/usage';
import { PDF_COLORS, pdfStyles } from '@/server/reports/time-tracking/time-report-pdf-styles';
import { BreakdownKind, type ReportShareRow, type TimeReport } from '@/types/time-report';

const LOGO_PATH = path.join(process.cwd(), 'src/server/reports/assets/codeacme-logo-mark.png');
const PERCENT = 100;
const COMPANY_WEBSITE = 'codeacme.com';

let logoPromise: Promise<Buffer> | null = null;
function loadLogo(): Promise<Buffer> {
  logoPromise ??= readFile(LOGO_PATH);
  return logoPromise;
}

function hours(minutes: number): string {
  return `${formatDecimalHours(minutes)} h`;
}

function SummaryBox({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View style={pdfStyles.summaryBox}>
      <Text style={pdfStyles.summaryLabel}>{label}</Text>
      <Text style={pdfStyles.summaryValue}>{value}</Text>
      {hint && <Text style={pdfStyles.summaryHint}>{hint}</Text>}
    </View>
  );
}

function ShareTable({ title, rows }: { title: string; rows: ReportShareRow[] }) {
  return (
    <View style={pdfStyles.shareTable} wrap={false}>
      <Text style={pdfStyles.sectionTitle}>{title}</Text>
      {rows.length === 0 && <Text style={pdfStyles.entryMeta}>No time logged.</Text>}
      {rows.map((row) => (
        <View key={row.label} style={pdfStyles.tableRow}>
          <Text style={pdfStyles.cellLabel}>{row.label}</Text>
          <Text style={pdfStyles.cellNumber}>{formatDecimalHours(row.minutes)}</Text>
          <Text style={pdfStyles.cellShare}>{Math.round(row.share * PERCENT)}%</Text>
        </View>
      ))}
    </View>
  );
}

function Summary({ report }: { report: TimeReport }) {
  const { usage } = report;
  return (
    <View style={pdfStyles.summaryRow}>
      <SummaryBox
        label="Total time"
        value={hours(report.totalMinutes)}
        hint={formatDuration(report.totalMinutes)}
      />
      <SummaryBox label="Items logged" value={String(report.entryCount)} />
      {usage && usage.limitMinutes !== null && (
        <>
          <SummaryBox label="Monthly limit" value={hours(usage.limitMinutes)} />
          <SummaryBox
            label="Remaining"
            value={hours(usage.remainingMinutes ?? 0)}
            hint={USAGE_STATUS_LABELS[usage.status]}
          />
        </>
      )}
    </View>
  );
}

function Breakdown({ report }: { report: TimeReport }) {
  return (
    <View wrap={false}>
      <Text style={pdfStyles.sectionTitle}>
        {report.breakdownKind === BreakdownKind.WEEK ? 'Hours by week' : 'Hours by day'}
      </Text>
      {report.breakdown.map((row) => (
        <View key={`${row.label}-${row.detail}`} style={pdfStyles.tableRow}>
          <Text style={pdfStyles.cellLabel}>{row.label}</Text>
          <Text style={pdfStyles.cellDetail}>{row.detail}</Text>
          <Text style={pdfStyles.cellNumber}>{formatDecimalHours(row.minutes)}</Text>
        </View>
      ))}
    </View>
  );
}

function DayLog({ report, accent }: { report: TimeReport; accent: string }) {
  const showAuthor = report.byMember.length > 1;
  return (
    <View>
      <Text style={pdfStyles.sectionTitle}>Day by day</Text>
      {report.days.map((day) => (
        <View key={day.dateKey} style={pdfStyles.dayBlock}>
          <View style={[pdfStyles.dayHeader, { backgroundColor: accent }]} wrap={false}>
            <Text style={pdfStyles.dayTitle}>{day.label}</Text>
            <Text style={pdfStyles.dayTitle}>{formatDuration(day.totalMinutes)}</Text>
          </View>
          {day.entries.map((entry, index) => (
            <View key={`${day.dateKey}-${index}`} style={pdfStyles.entryRow} wrap={false}>
              <Text style={pdfStyles.entryDuration}>{formatDuration(entry.durationMinutes)}</Text>
              <View style={pdfStyles.entryBody}>
                <Text>{entry.task}</Text>
                <Text style={pdfStyles.entryMeta}>
                  {[
                    entry.categoryName,
                    entry.requestedBy && `Requested by ${entry.requestedBy}`,
                    showAuthor && entry.userName,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ))}
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
  const isBranded = logo !== null;
  // One person's time is already the whole total, so the per-person table would only repeat it.
  const showsMembers = report.byMember.length > 1;
  return (
    <Document
      title={`${report.client.name} time report · ${report.period.label}`}
      author={preparedBy ?? (isBranded ? SITE.COMPANY : undefined)}
    >
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header} fixed>
          {isBranded ? (
            <View style={pdfStyles.brandRow}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt attribute */}
              <Image src={{ data: logo, format: 'png' }} style={pdfStyles.logo} />
              <Text style={pdfStyles.company}>{SITE.COMPANY}</Text>
            </View>
          ) : (
            <Text style={pdfStyles.company}>{report.client.name}</Text>
          )}
          <Text style={pdfStyles.eyebrow}>Time report</Text>
        </View>
        <Text style={pdfStyles.footer} fixed>
          {footerText({ report, logo, preparedBy })}
        </Text>
        <Text
          style={[pdfStyles.eyebrow, { color: isBranded ? PDF_COLORS.brand : PDF_COLORS.muted }]}
        >
          {report.period.label}
        </Text>
        <Text style={pdfStyles.title}>{report.client.name}</Text>
        {report.client.contactName && (
          <Text style={pdfStyles.subtitle}>For {report.client.contactName}</Text>
        )}
        <Text style={pdfStyles.meta}>
          {formatDateKey(report.period.startKey, 'd MMM yyyy')} –{' '}
          {formatDateKey(report.period.endKey, 'd MMM yyyy')} · Generated{' '}
          {formatDateKey(report.generatedOn, 'd MMM yyyy')}
          {preparedBy ? ` · Prepared by ${preparedBy}` : ''}
        </Text>
        <Summary report={report} />
        <View style={pdfStyles.twoColumns}>
          <View style={pdfStyles.column}>
            <Breakdown report={report} />
          </View>
          <View style={pdfStyles.column}>
            <ShareTable title="Hours by category" rows={report.byCategory} />
            {showsMembers && <ShareTable title="Hours by team member" rows={report.byMember} />}
          </View>
        </View>
        <DayLog report={report} accent={isBranded ? PDF_COLORS.brandWash : PDF_COLORS.wash} />
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
