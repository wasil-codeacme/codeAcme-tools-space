import type { ReportFormat } from '@/server/validators/time-tracking/time-report.schema';
import type { TimeReport } from '@/types/time-report';

export function reportFileName(report: TimeReport, format: ReportFormat): string {
  return `${report.client.slug}-time-report-${report.period.slug}.${format}`;
}
