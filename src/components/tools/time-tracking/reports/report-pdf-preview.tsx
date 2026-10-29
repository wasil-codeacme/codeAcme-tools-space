import { CircleHelp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MESSAGES } from '@/lib/messages';

// The page shows the real PDF, so what you check on screen is exactly what the client receives.
export function ReportPdfPreview({
  pdfHref,
  title,
  needsReviewCount,
}: {
  pdfHref: string;
  title: string;
  needsReviewCount: number;
}) {
  return (
    <div className="space-y-3">
      {needsReviewCount > 0 && (
        <p className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-800">
          <CircleHelp className="size-4 shrink-0" />
          {MESSAGES.REPORT.NEEDS_REVIEW(needsReviewCount)} Check them before sending.
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <p className="ca-eyebrow text-muted-foreground">Preview</p>
        {/* Phone browsers often cannot show a PDF inside a page, so offer the full view too. */}
        <Button variant="ghost" size="sm" asChild>
          <a href={pdfHref} target="_blank" rel="noreferrer">
            <ExternalLink />
            Open full screen
          </a>
        </Button>
      </div>
      <div className="bg-muted relative h-[80vh] min-h-[32rem] overflow-hidden rounded-2xl border">
        <iframe key={pdfHref} src={pdfHref} title={title} className="absolute inset-0 size-full" />
      </div>
    </div>
  );
}
