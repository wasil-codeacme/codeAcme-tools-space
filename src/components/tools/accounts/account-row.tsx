'use client';

import { useTransition } from 'react';
import {
  Archive,
  ArchiveRestore,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { CopyTextButton } from '@/components/tools/accounts/copy-text-button';
import { SecretControl } from '@/components/tools/accounts/secret-control';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { reportActionError } from '@/lib/action-feedback';
import { ACCESS_LEVEL_LABELS } from '@/lib/accounts/labels';
import { MESSAGES } from '@/lib/messages';
import { cn } from '@/lib/utils';
import { setAccountArchived } from '@/server/actions/accounts/account.actions';
import { SecretField, type AccountView } from '@/types/accounts';

interface AccountRowProps {
  account: AccountView;
  isAdmin: boolean;
  canEdit: boolean;
  onEdit: () => void;
}

function hostOf(url: string): string {
  return new URL(url).host.replace(/^www\./, '');
}

export function AccountRow({ account, isAdmin, canEdit, onEdit }: AccountRowProps) {
  const [isPending, startTransition] = useTransition();

  function toggleArchived() {
    startTransition(async () => {
      const result = await setAccountArchived({
        accountId: account.id,
        isArchived: !account.isArchived,
      });
      if (result.error !== undefined) {
        reportActionError(result.error);
        return;
      }
      toast.success(
        account.isArchived ? MESSAGES.ACCOUNT.RESTORE_SUCCESS : MESSAGES.ACCOUNT.ARCHIVE_SUCCESS,
      );
    });
  }

  return (
    <li
      className={cn(
        'relative grid gap-1.5 px-4 py-3.5 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1.1fr)_auto] md:items-center md:gap-3',
        account.isArchived && 'opacity-55',
      )}
    >
      <div className="flex min-w-0 items-start gap-3 max-md:pr-9">
        <span className="bg-accent text-accent-foreground font-heading flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold">
          {account.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-1.5 font-medium">
            {account.name}
            {account.accessLevel && (
              <Badge variant="secondary">{ACCESS_LEVEL_LABELS[account.accessLevel]}</Badge>
            )}
            {account.twoFactor && (
              <Badge
                className="bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                title={account.twoFactor}
              >
                <ShieldCheck />
                2FA
              </Badge>
            )}
            {account.isArchived && <Badge variant="outline">Archived</Badge>}
          </p>
          {account.purpose && (
            <p className="text-muted-foreground text-sm text-pretty">{account.purpose}</p>
          )}
        </div>
      </div>

      {/* On phones link and login share one line under the name; on desktop they are grid columns. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 max-md:pl-12 md:contents">
        <div className="min-w-0 text-sm">
          {account.url ? (
            <a
              href={account.url}
              target="_blank"
              rel="noreferrer"
              className="text-primary inline-flex max-w-full items-center gap-1 underline-offset-4 hover:underline"
            >
              <span className="truncate">{hostOf(account.url)}</span>
              <ExternalLink className="size-3 shrink-0" />
            </a>
          ) : (
            <span className="text-muted-foreground/60">No link</span>
          )}
        </div>

        <div className="flex min-w-0 items-center gap-1 text-sm">
          {account.username ? (
            <>
              <span className="truncate" title={account.username}>
                {account.username}
              </span>
              <CopyTextButton value={account.username} label="Copy login" />
            </>
          ) : (
            <span className="text-muted-foreground/60">No login</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 max-md:pl-12">
        <SecretControl
          accountId={account.id}
          field={SecretField.SECRET}
          hasSecret={account.hasSecret}
          canReveal={canEdit}
          emptyLabel="No password"
          onAdd={canEdit ? onEdit : undefined}
        />
        {account.hasSecureNotes && (
          <SecretControl
            accountId={account.id}
            field={SecretField.SECURE_NOTES}
            hasSecret
            canReveal={canEdit}
            label="Secure notes"
          />
        )}
      </div>

      {canEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="max-md:absolute max-md:top-3 max-md:right-2"
              aria-label={`Actions for ${account.name}`}
              disabled={isPending}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={toggleArchived}>
                  {account.isArchived ? <ArchiveRestore /> : <Archive />}
                  {account.isArchived ? 'Restore' : 'Archive'}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  );
}
