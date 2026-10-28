import { describe, expect, it } from 'vitest';
import { ReportPeriod, resolvePeriod } from '@/lib/time-tracking/report-period';
import { escapeCsvCell, renderTimeReportCsv } from '@/server/reports/time-tracking/time-report-csv';
import { aggregateTimeReport } from '@/server/services/time-tracking/time-report.aggregate';

describe('escapeCsvCell', () => {
  it('quotes commas, quotes and line breaks', () => {
    expect(escapeCsvCell('misc , 2FA logins')).toBe('"misc , 2FA logins"');
    expect(escapeCsvCell('said "hi"')).toBe('"said ""hi"""');
    expect(escapeCsvCell('two\nlines')).toBe('"two\nlines"');
  });

  it('neutralises cells a spreadsheet would run as a formula', () => {
    expect(escapeCsvCell('=HYPERLINK("http://evil")')).toBe(`"'=HYPERLINK(""http://evil"")"`);
    expect(escapeCsvCell('+1')).toBe("'+1");
    expect(escapeCsvCell('@cmd')).toBe("'@cmd");
  });

  it('renders null as an empty cell', () => {
    expect(escapeCsvCell(null)).toBe('');
  });
});

describe('renderTimeReportCsv', () => {
  it('writes a BOM, a header and one row per entry', () => {
    const report = aggregateTimeReport({
      client: { name: 'Client', slug: 'client', contactName: null, monthlyLimitMinutes: null },
      period: resolvePeriod(ReportPeriod.WEEK, '2026-10-21'),
      generatedOn: '2026-10-28',
      entries: [
        {
          id: 'one',
          clientId: 'client',
          userId: 'user',
          userName: 'Dev',
          categoryId: null,
          categoryName: null,
          dateKey: '2026-10-21',
          durationMinutes: 70,
          task: 'Meeting, with Anna',
          requestedBy: 'Anna',
          link: null,
          needsReview: true,
        },
      ],
    });

    const lines = renderTimeReportCsv(report).split('\r\n');
    expect(lines[0]?.startsWith('﻿Date,Day,Minutes')).toBe(true);
    expect(lines[1]).toBe('2026-10-21,Wed,70,1.17,"Meeting, with Anna",,Dev,Anna,,yes');
  });
});
