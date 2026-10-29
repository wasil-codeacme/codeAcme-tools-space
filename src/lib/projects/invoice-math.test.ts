import { describe, expect, it } from 'vitest';
import {
  dollarsToCents,
  formatInvoiceNumber,
  formatMoney,
  invoiceTotalCents,
  lineAmountCents,
} from '@/lib/projects/invoice-math';

describe('invoice math', () => {
  it('charges exact minutes at the hourly rate', () => {
    // 20 hours at $45/h.
    expect(lineAmountCents({ minutes: 1200, rateCents: 4500 })).toBe(90_000);
    // 1h 10m at $45/h is $52.50.
    expect(lineAmountCents({ minutes: 70, rateCents: 4500 })).toBe(5250);
  });

  it('rounds each line to the cent and adds the lines', () => {
    // 7 minutes at $33.33/h is $3.8885, rounded to $3.89.
    expect(lineAmountCents({ minutes: 7, rateCents: 3333 })).toBe(389);
    expect(
      invoiceTotalCents([
        { minutes: 7, rateCents: 3333 },
        { minutes: 60, rateCents: 5000 },
      ]),
    ).toBe(5389);
  });

  it('formats money and invoice numbers', () => {
    expect(formatMoney(90_000, 'USD')).toBe('$900.00');
    expect(dollarsToCents(45.5)).toBe(4550);
    expect(formatInvoiceNumber(2026, 7)).toBe('INV-2026-007');
    expect(formatInvoiceNumber(2026, 1234)).toBe('INV-2026-1234');
  });
});
