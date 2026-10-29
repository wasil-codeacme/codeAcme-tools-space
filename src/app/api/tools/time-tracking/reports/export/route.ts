import type { NextRequest } from 'next/server';
import { canUseTool, ToolId } from '@/config/tools';
import { Role } from '@/generated/prisma/enums';
import { HTTP_STATUS } from '@/lib/http-status';
import { logger } from '@/lib/logger';
import { MESSAGES } from '@/lib/messages';
import { getSessionUser } from '@/server/auth/session-context';
import { NotFoundError } from '@/server/errors';
import { reportFileName } from '@/server/reports/time-tracking/report-file-name';
import { renderTimeReportCsv } from '@/server/reports/time-tracking/time-report-csv';
import { renderTimeReportPdf } from '@/server/reports/time-tracking/time-report-pdf';
import { buildTimeReport } from '@/server/services/time-tracking/time-report.service';
import { getTodayKey } from '@/server/time-zone';
import {
  ReportBranding,
  ReportFormat,
  reportExportQuerySchema,
} from '@/server/validators/time-tracking/time-report.schema';

function fileResponse(
  body: BodyInit,
  contentType: string,
  fileName: string,
  inline = false,
): Response {
  return new Response(body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(request: NextRequest) {
  const actor = await getSessionUser();
  if (!actor) {
    return Response.json(
      { error: MESSAGES.AUTH.SESSION_EXPIRED },
      { status: HTTP_STATUS.UNAUTHORIZED },
    );
  }
  if (actor.role !== Role.ADMIN || !canUseTool(actor, ToolId.TIME_TRACKING)) {
    return Response.json({ error: MESSAGES.GENERIC.FORBIDDEN }, { status: HTTP_STATUS.FORBIDDEN });
  }
  const parsed = reportExportQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!parsed.success) {
    return Response.json(
      { error: MESSAGES.GENERIC.VALIDATION_FAILED },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  try {
    const { format, branding, preparedBy, inline } = parsed.data;
    const report = await buildTimeReport(actor, parsed.data, await getTodayKey());
    const fileName = reportFileName(report, format);
    if (format === ReportFormat.CSV) {
      return fileResponse(renderTimeReportCsv(report), 'text/csv; charset=utf-8', fileName);
    }
    const pdf = await renderTimeReportPdf(report, {
      branded: branding === ReportBranding.CODEACME,
      preparedBy: preparedBy || null,
    });
    return fileResponse(new Uint8Array(pdf), 'application/pdf', fileName, inline === '1');
  } catch (error) {
    if (error instanceof NotFoundError) {
      return Response.json(
        { error: MESSAGES.GENERIC.NOT_FOUND },
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }
    logger.error({ err: error, actorId: actor.id }, 'Report export failed');
    return Response.json(
      { error: MESSAGES.GENERIC.UNEXPECTED },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
