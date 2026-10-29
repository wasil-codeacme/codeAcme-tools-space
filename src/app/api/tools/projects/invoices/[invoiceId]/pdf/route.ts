import { ToolId, canUseTool } from '@/config/tools';
import { Role } from '@/generated/prisma/enums';
import { HTTP_STATUS } from '@/lib/http-status';
import { logger } from '@/lib/logger';
import { MESSAGES } from '@/lib/messages';
import { getSessionUser } from '@/server/auth/session-context';
import { NotFoundError } from '@/server/errors';
import { renderInvoicePdf } from '@/server/reports/projects/invoice-pdf';
import { getInvoice } from '@/server/services/projects/projects.service';
import { idSchema } from '@/server/validators/shared.schema';

export async function GET(
  request: Request,
  { params }: RouteContext<'/api/tools/projects/invoices/[invoiceId]/pdf'>,
) {
  const actor = await getSessionUser();
  if (!actor) {
    return Response.json(
      { error: MESSAGES.AUTH.SESSION_EXPIRED },
      { status: HTTP_STATUS.UNAUTHORIZED },
    );
  }
  if (actor.role !== Role.ADMIN || !canUseTool(actor, ToolId.PROJECTS)) {
    return Response.json({ error: MESSAGES.GENERIC.FORBIDDEN }, { status: HTTP_STATUS.FORBIDDEN });
  }
  const parsed = idSchema.safeParse((await params).invoiceId);
  if (!parsed.success) {
    return Response.json(
      { error: MESSAGES.GENERIC.VALIDATION_FAILED },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  try {
    const invoice = await getInvoice(actor, parsed.data);
    const pdf = await renderInvoicePdf(invoice);
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        // ?inline=1 opens the PDF in the browser to look it over; otherwise it downloads.
        'Content-Disposition': `${new URL(request.url).searchParams.get('inline') === '1' ? 'inline' : 'attachment'}; filename="${invoice.number}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return Response.json(
        { error: MESSAGES.GENERIC.NOT_FOUND },
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }
    logger.error({ err: error, actorId: actor.id }, 'Invoice PDF failed');
    return Response.json(
      { error: MESSAGES.GENERIC.UNEXPECTED },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
