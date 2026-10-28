import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ListPageSkeleton } from '@/components/platform/skeletons';
import { Badge } from '@/components/ui/badge';
import { AccountAuditAction } from '@/generated/prisma/enums';
import { AUDIT_ACTION_LABELS, INTERNAL_SCOPE_LABEL } from '@/lib/accounts/labels';
import { cn } from '@/lib/utils';
import { requireAdmin } from '@/server/auth/guards';
import { listAccountActivity } from '@/server/services/accounts/account.service';
import { getUserTimeZone } from '@/server/time-zone';

export const metadata: Metadata = { title: 'Accounts · Activity' };

const SENSITIVE_ACTIONS = new Set<AccountAuditAction>([
  AccountAuditAction.REVEALED,
  AccountAuditAction.COPIED,
  AccountAuditAction.SECRET_CHANGED,
]);

async function ActivityContent() {
  await requireAdmin();
  const [events, timeZone] = await Promise.all([listAccountActivity(), getUserTimeZone()]);
  const formatter = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  });

  if (events.length === 0) {
    return <p className="text-muted-foreground text-sm">No activity yet.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Every time someone adds, edits, reveals or copies a secret. Newest first.
      </p>
      <ul className="bg-card divide-y overflow-hidden rounded-2xl border">
        {events.map((event) => (
          <li
            key={event.id}
            className="grid gap-1 px-4 py-2.5 text-sm sm:grid-cols-[180px_1fr_auto] sm:items-center"
          >
            <span className="text-muted-foreground font-figures text-xs">
              {formatter.format(new Date(event.createdAt))}
            </span>
            <span>
              <span className="font-medium">{event.userName}</span>{' '}
              <span className="text-muted-foreground">on</span>{' '}
              <span className="font-medium">{event.accountName}</span>{' '}
              <span className="text-muted-foreground">
                ({event.clientName ?? INTERNAL_SCOPE_LABEL})
              </span>
            </span>
            <Badge
              className={cn(
                SENSITIVE_ACTIONS.has(event.action)
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {AUDIT_ACTION_LABELS[event.action]}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AccountActivityPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <ActivityContent />
    </Suspense>
  );
}
