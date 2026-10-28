'use client';

import { useMemo, useState, useTransition } from 'react';
import { ClipboardPaste, Loader2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { OwnerSelect } from '@/components/tools/accounts/owner-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { reportActionError } from '@/lib/action-feedback';
import { ACCESS_LEVEL_LABELS, INTERNAL_SCOPE } from '@/lib/accounts/labels';
import { parseAccountTable } from '@/lib/accounts/parse-account-table';
import { MESSAGES } from '@/lib/messages';
import { importAccounts } from '@/server/actions/accounts/account.actions';

const SHEET_PLACEHOLDER = `| Tool | What we use it for | Link | Login email | Access level |
| :---- | :---- | :---- | :---- | :---- |
| Circle | The community | https://example.circle.so | owner@example.com | Master |`;

interface ImportAccountsDialogProps {
  clients: { id: string; name: string }[];
  isAdmin: boolean;
  defaultScope: string;
  onClose: () => void;
}

export function ImportAccountsDialog({
  clients,
  isAdmin,
  defaultScope,
  onClose,
}: ImportAccountsDialogProps) {
  const [text, setText] = useState('');
  const [scope, setScope] = useState(defaultScope);
  const [isPending, startTransition] = useTransition();
  const parsed = useMemo(() => parseAccountTable(text), [text]);

  function submit() {
    startTransition(async () => {
      const result = await importAccounts({
        clientId: scope === INTERNAL_SCOPE ? null : scope,
        rows: parsed.rows,
      });
      if (result.error !== undefined) {
        reportActionError(result.error);
        return;
      }
      toast.success(MESSAGES.ACCOUNT.IMPORT_SUCCESS(result.data.count), {
        description: 'Add the passwords from each account’s Edit menu.',
      });
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92svh] overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <ClipboardPaste className="size-4" />
            Paste from sheet
          </DialogTitle>
          <DialogDescription>
            Paste your accounts table (copied from Google Docs or Sheets). Columns are matched by
            their headings: Tool, What we use it for, Link, Login email, Access level.
          </DialogDescription>
        </DialogHeader>
        <div className="grid min-h-0 gap-4 md:grid-cols-2">
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={SHEET_PLACEHOLDER}
            aria-label="Accounts table"
            className="font-figures min-h-72 resize-none text-xs md:h-[50svh]"
          />
          <ScrollArea className="h-72 rounded-xl border md:h-[50svh]">
            {parsed.rows.length === 0 ? (
              <p className="text-muted-foreground p-6 text-center text-sm">
                A preview of the accounts shows up here as you paste.
              </p>
            ) : (
              <ul className="divide-y">
                {parsed.rows.map((row, index) => (
                  <li key={`${row.name}-${index}`} className="space-y-0.5 px-3 py-2 text-sm">
                    <p className="flex flex-wrap items-center gap-1.5 font-medium">
                      {row.name}
                      {row.accessLevel && (
                        <Badge variant="secondary">{ACCESS_LEVEL_LABELS[row.accessLevel]}</Badge>
                      )}
                      {row.twoFactor && <Badge variant="outline">2FA</Badge>}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {[row.url, row.username].filter(Boolean).join(' · ') || 'No link or login'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {parsed.skipped.length > 0 && (
              <div className="bg-muted/50 m-3 space-y-1 rounded-lg p-2.5">
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                  <TriangleAlert className="size-3.5" />
                  Not imported
                </p>
                {parsed.skipped.map((line) => (
                  <p key={line.lineNumber} className="text-muted-foreground truncate text-xs">
                    L{line.lineNumber} {line.text}
                  </p>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
        <DialogFooter className="items-center gap-3 sm:justify-between">
          <div className="w-60">
            <OwnerSelect value={scope} onChange={setScope} clients={clients} isAdmin={isAdmin} />
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={isPending || parsed.rows.length === 0}>
              {isPending && <Loader2 className="animate-spin" />}
              Import {parsed.rows.length > 0 ? parsed.rows.length : ''} accounts
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
