'use client';

import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { MESSAGES } from '@/lib/messages';

export function CopyTextButton({ value, label }: { value: string; label: string }) {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label={label}
      title={label}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        toast.success(MESSAGES.ACCOUNT.COPY_SUCCESS);
      }}
    >
      <Copy />
    </Button>
  );
}
