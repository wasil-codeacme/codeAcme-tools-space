'use client';

import { useEffect, useState, useTransition } from 'react';
import { Copy, Eye, EyeOff, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { reportActionError } from '@/lib/action-feedback';
import { SECRET_VISIBLE_MS } from '@/lib/constants';
import { MESSAGES } from '@/lib/messages';
import { revealAccountSecret } from '@/server/actions/accounts/account.actions';
import { RevealIntent, type SecretField } from '@/types/accounts';

const MASK = '••••••••••';

interface SecretControlProps {
  accountId: string;
  field: SecretField;
  hasSecret: boolean;
  label?: string;
  emptyLabel?: string;
  onAdd?: () => void;
}

// Secrets are fetched only on demand (each fetch is audited) and hidden again after a short while.
export function SecretControl({
  accountId,
  field,
  hasSecret,
  label,
  emptyLabel,
  onAdd,
}: SecretControlProps) {
  const [value, setValue] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (value === null) {
      return;
    }
    const timer = window.setTimeout(() => setValue(null), SECRET_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [value]);

  function fetchSecret(intent: RevealIntent) {
    startTransition(async () => {
      const result = await revealAccountSecret({ accountId, field, intent });
      if (result.error !== undefined) {
        reportActionError(result.error);
        return;
      }
      if (intent === RevealIntent.COPY) {
        await navigator.clipboard.writeText(result.data.value);
        toast.success(MESSAGES.ACCOUNT.COPY_SUCCESS);
        return;
      }
      setValue(result.data.value);
    });
  }

  if (!hasSecret) {
    return onAdd ? (
      <Button variant="ghost" size="xs" className="text-muted-foreground w-fit" onClick={onAdd}>
        <Plus />
        {emptyLabel ?? 'Add'}
      </Button>
    ) : null;
  }

  return (
    <div className="flex min-w-0 items-center gap-1">
      {label && <span className="text-muted-foreground shrink-0 text-xs">{label}:</span>}
      <span
        className="font-figures min-w-0 truncate text-sm select-all"
        title={value ?? undefined}
        aria-live="polite"
      >
        {value ?? MASK}
      </span>
      {isPending ? (
        <Loader2 className="text-muted-foreground size-3.5 animate-spin" />
      ) : (
        <>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={value === null ? 'Reveal' : 'Hide'}
            title={value === null ? 'Reveal' : 'Hide'}
            onClick={() => (value === null ? fetchSecret(RevealIntent.REVEAL) : setValue(null))}
          >
            {value === null ? <Eye /> : <EyeOff />}
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Copy"
            title="Copy"
            onClick={() => fetchSecret(RevealIntent.COPY)}
          >
            <Copy />
          </Button>
        </>
      )}
    </div>
  );
}
