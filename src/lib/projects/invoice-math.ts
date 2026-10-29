const MINUTES_PER_HOUR = 60;
const CENTS_PER_UNIT = 100;
const INVOICE_NUMBER_DIGITS = 3;

export interface InvoiceLineAmounts {
  minutes: number;
  rateCents: number;
}

// Exact minutes times an hourly rate, rounded once to the cent.
export function lineAmountCents({ minutes, rateCents }: InvoiceLineAmounts): number {
  return Math.round((minutes * rateCents) / MINUTES_PER_HOUR);
}

export function invoiceTotalCents(lines: readonly InvoiceLineAmounts[]): number {
  return lines.reduce((total, line) => total + lineAmountCents(line), 0);
}

export function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
    cents / CENTS_PER_UNIT,
  );
}

export function dollarsToCents(amount: number): number {
  return Math.round(amount * CENTS_PER_UNIT);
}

export function formatInvoiceNumber(year: number, sequence: number): string {
  return `INV-${year}-${String(sequence).padStart(INVOICE_NUMBER_DIGITS, '0')}`;
}
