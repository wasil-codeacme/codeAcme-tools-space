'use client';

import { useDeferredValue, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { AccountFormDialog } from '@/components/tools/accounts/account-form-dialog';
import { AccountRow } from '@/components/tools/accounts/account-row';
import { AccountsToolbar } from '@/components/tools/accounts/accounts-toolbar';
import { ImportAccountsDialog } from '@/components/tools/accounts/import-accounts-dialog';
import { AccountListSkeleton } from '@/components/tools/accounts/skeletons';
import { PendingSection } from '@/components/platform/pending-navigation';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { useSearchParamNavigation } from '@/hooks/use-search-param-navigation';
import { ALL_SCOPES, INTERNAL_SCOPE, INTERNAL_SCOPE_LABEL } from '@/lib/accounts/labels';
import type { AccountView } from '@/types/accounts';

interface AccountsWorkspaceProps {
  accounts: AccountView[];
  clients: { id: string; name: string }[];
  isAdmin: boolean;
  // View-only members see what exists and where it lives, but cannot reveal or change secrets.
  canEdit: boolean;
  showArchived: boolean;
  initialScope: string;
  initialSearch: string;
}

type DialogState =
  { kind: 'create' } | { kind: 'edit'; account: AccountView } | { kind: 'import' } | null;

function matches(account: AccountView, scope: string, query: string): boolean {
  const inScope =
    scope === ALL_SCOPES ||
    (scope === INTERNAL_SCOPE ? account.clientId === null : account.clientId === scope);
  if (!inScope) {
    return false;
  }
  const needle = query.trim().toLowerCase();
  return (
    !needle ||
    [account.name, account.purpose, account.url, account.username]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(needle))
  );
}

function groupByOwner(accounts: AccountView[]): [string, AccountView[]][] {
  const groups = new Map<string, AccountView[]>();
  for (const account of accounts) {
    const owner = account.clientName ?? INTERNAL_SCOPE_LABEL;
    groups.set(owner, [...(groups.get(owner) ?? []), account]);
  }
  return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right));
}

export function AccountsWorkspace(props: AccountsWorkspaceProps) {
  const { accounts, clients, isAdmin, canEdit } = props;
  const [scope, setScope] = useState(props.initialScope);
  const [search, setSearch] = useState(props.initialSearch);
  const [dialog, setDialog] = useState<DialogState>(null);
  const deferredSearch = useDeferredValue(search);
  const { navigate, replaceQuietly } = useSearchParamNavigation();
  const visible = accounts.filter((account) => matches(account, scope, deferredSearch));

  return (
    <div className="space-y-5">
      <AccountsToolbar
        clients={clients}
        isAdmin={isAdmin}
        canEdit={canEdit}
        scope={scope}
        search={search}
        showArchived={props.showArchived}
        onScopeChange={(next) => {
          setScope(next);
          replaceQuietly({ client: next === ALL_SCOPES ? null : next });
        }}
        onSearchChange={(next) => {
          setSearch(next);
          replaceQuietly({ q: next || null });
        }}
        onShowArchivedChange={(checked) => navigate({ archived: checked ? '1' : null })}
        onCreate={() => setDialog({ kind: 'create' })}
        onImport={() => setDialog({ kind: 'import' })}
      />

      <PendingSection fallback={<AccountListSkeleton />}>
        {visible.length === 0 ? (
          <Empty className="bg-card/60 rounded-2xl border border-dashed py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <KeyRound />
              </EmptyMedia>
              <EmptyTitle>
                {accounts.length === 0 ? 'No accounts yet' : 'Nothing matches'}
              </EmptyTitle>
              <EmptyDescription>
                {accounts.length === 0
                  ? 'Add an account, or paste your existing accounts sheet to bring everything in at once.'
                  : 'Try a different client or search term.'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          groupByOwner(visible).map(([owner, ownerAccounts]) => (
            <section key={owner} className="space-y-2">
              <h2 className="text-muted-foreground flex items-baseline gap-2 px-1 text-xs font-semibold tracking-wider uppercase">
                {owner}
                <span className="font-figures font-normal">{ownerAccounts.length}</span>
              </h2>
              <ul className="ca-glow bg-card divide-y overflow-hidden rounded-2xl border">
                {ownerAccounts.map((account) => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    isAdmin={isAdmin}
                    canEdit={canEdit}
                    onEdit={() => setDialog({ kind: 'edit', account })}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </PendingSection>

      {(dialog?.kind === 'create' || dialog?.kind === 'edit') && (
        <AccountFormDialog
          account={dialog.kind === 'edit' ? dialog.account : null}
          clients={clients}
          isAdmin={isAdmin}
          defaultScope={scope === ALL_SCOPES ? (clients[0]?.id ?? INTERNAL_SCOPE) : scope}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'import' && (
        <ImportAccountsDialog
          clients={clients}
          isAdmin={isAdmin}
          defaultScope={scope === ALL_SCOPES ? (clients[0]?.id ?? INTERNAL_SCOPE) : scope}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
