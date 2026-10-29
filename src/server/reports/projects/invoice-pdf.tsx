import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  Document,
  Image,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer';
import { SITE } from '@/config/site';
import { formatMoney, lineAmountCents } from '@/lib/projects/invoice-math';
import { formatDateKey } from '@/lib/time-tracking/date-key';
import { formatDecimalHours } from '@/lib/time-tracking/duration';
import { PDF_COLORS, pdfStyles } from '@/server/reports/time-tracking/time-report-pdf-styles';
import type { InvoiceView } from '@/types/projects';

const LOGO_PATH = path.join(process.cwd(), 'src/server/reports/assets/codeacme-logo-mark.png');
const DATE_FORMAT = 'd MMM yyyy';
const COMPANY_WEBSITE = 'codeacme.com';
const BAND_MUTED = '#D9CCFB';

let logoPromise: Promise<Buffer> | null = null;
function loadLogo(): Promise<Buffer> {
  logoPromise ??= readFile(LOGO_PATH);
  return logoPromise;
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
  bandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  label: { fontSize: 7.5, letterSpacing: 1.2, color: PDF_COLORS.muted, textTransform: 'uppercase' },
  strong: { fontFamily: 'Helvetica-Bold' },
  big: { fontFamily: 'Helvetica-Bold', fontSize: 24, marginTop: 2 },
  tableHead: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.border,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.border,
  },
  description: { flex: 1, paddingRight: 8 },
  number: { width: 70, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 24 },
  box: {
    marginTop: 22,
    padding: 12,
    borderRadius: 6,
    backgroundColor: PDF_COLORS.brandWash,
  },
  paragraph: { marginTop: 4 },
  link: { color: PDF_COLORS.brand, textDecoration: 'none' },
});

function InvoiceDocument({ invoice, logo }: { invoice: InvoiceView; logo: Buffer }) {
  const money = (cents: number) => formatMoney(cents, invoice.currency);
  return (
    <Document title={`${invoice.number} · ${invoice.clientName}`} author={SITE.COMPANY}>
      <Page size="A4" style={pdfStyles.page}>
        <View style={[pdfStyles.band, { backgroundColor: PDF_COLORS.brand }]}>
          <View style={pdfStyles.bandTop}>
            <View style={pdfStyles.logoChip}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt attribute */}
              <Image src={{ data: logo, format: 'png' }} style={pdfStyles.logo} />
              <Text style={pdfStyles.company}>{SITE.COMPANY}</Text>
            </View>
            <Text style={[pdfStyles.eyebrow, { color: BAND_MUTED }]}>Invoice</Text>
          </View>
          <View style={styles.bandRow}>
            <View>
              <Text style={[pdfStyles.eyebrow, { color: BAND_MUTED }]}>Invoice number</Text>
              <Text style={[pdfStyles.bandTitle, { color: PDF_COLORS.white, marginTop: 4 }]}>
                {invoice.number}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[pdfStyles.eyebrow, { color: BAND_MUTED }]}>Amount due</Text>
              <Text style={[pdfStyles.bandTitle, { color: PDF_COLORS.white, marginTop: 4 }]}>
                {money(invoice.totalCents)}
              </Text>
            </View>
          </View>
          <View style={pdfStyles.bandMetaRow}>
            {[
              { label: 'Issued', value: formatDateKey(invoice.issueDate, DATE_FORMAT) },
              { label: 'Due', value: formatDateKey(invoice.dueDate, DATE_FORMAT) },
              ...(invoice.projectName ? [{ label: 'Project', value: invoice.projectName }] : []),
            ].map((item) => (
              <View key={item.label}>
                <Text style={[pdfStyles.bandMetaLabel, { color: BAND_MUTED }]}>{item.label}</Text>
                <Text style={[pdfStyles.bandMetaValue, { color: PDF_COLORS.white }]}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.topRow}>
          <View>
            <Text style={styles.label}>Billed to</Text>
            <Text style={[styles.strong, styles.paragraph]}>{invoice.clientName}</Text>
            {invoice.clientContactName && <Text>{invoice.clientContactName}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.label}>From</Text>
            <Text style={[styles.strong, styles.paragraph]}>{SITE.COMPANY}</Text>
            <Text>{COMPANY_WEBSITE}</Text>
          </View>
        </View>

        <View style={styles.tableHead}>
          <Text style={[styles.label, styles.description]}>Description</Text>
          <Text style={[styles.label, styles.number]}>Hours</Text>
          <Text style={[styles.label, styles.number]}>Rate</Text>
          <Text style={[styles.label, styles.number]}>Amount</Text>
        </View>
        {invoice.lines.map((line, index) => (
          <View key={index} style={styles.tableRow} wrap={false}>
            <Text style={styles.description}>{line.description}</Text>
            <Text style={styles.number}>{formatDecimalHours(line.minutes)}</Text>
            <Text style={styles.number}>{money(line.rateCents)}/h</Text>
            <Text style={styles.number}>{money(lineAmountCents(line))}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.label}>Total due</Text>
          <Text style={[styles.strong, { fontSize: 14, color: PDF_COLORS.brand }]}>
            {money(invoice.totalCents)}
          </Text>
        </View>

        <View style={styles.box} wrap={false}>
          <Text style={styles.label}>How to pay</Text>
          <Text style={styles.paragraph}>{invoice.paymentDetails}</Text>
          {invoice.paymentLink && (
            <Link src={invoice.paymentLink} style={[styles.paragraph, styles.link]}>
              Pay online: {invoice.paymentLink}
            </Link>
          )}
        </View>

        {invoice.terms && (
          <View style={{ marginTop: 16 }} wrap={false}>
            <Text style={styles.label}>Terms</Text>
            <Text style={styles.paragraph}>{invoice.terms}</Text>
          </View>
        )}
        {invoice.notes && (
          <View style={{ marginTop: 12 }} wrap={false}>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.paragraph}>{invoice.notes}</Text>
          </View>
        )}

        <Text style={pdfStyles.footer} fixed>
          {SITE.COMPANY} · {COMPANY_WEBSITE}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(invoice: InvoiceView): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument invoice={invoice} logo={await loadLogo()} />);
}
