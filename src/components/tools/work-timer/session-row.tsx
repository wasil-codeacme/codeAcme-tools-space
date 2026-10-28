'use client';

import { useTransition } from 'react';
import { CheckCircle2, ClipboardPlus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
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
import { MESSAGES } from '@/lib/messages';
import { formatDuration } from '@/lib/time-tracking/duration';
import {
  deleteWorkSession,
  logWorkSession,
} from '@/server/actions/work-timer/work-session.actions';
import type { ActionResponse } from '@/types';
import type { WorkSessionHistoryItem } from '@/types/work-timer';

interface SessionRowProps {
  session: WorkSessionHistoryItem;
  showAuthor: boolean;
  canModify: boolean;
  onEdit: () => void;
}

export function SessionRow({ session, showAuthor, canModify, onEdit }: SessionRowProps) {
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<ActionResponse<unknown>>, successMessage: string) {
    startTransition(async () => {
      const result = await action();
      if (result.error !== undefined) {
        reportActionError(result.error);
        return;
      }
      toast.success(successMessage);
    });
  }

  return (
    <li className="hover:bg-muted/40 @container flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm">
      <span className="font-figures text-muted-foreground w-28 shrink-0">
        {session.startLabel} – {session.endLabel}
      </span>
      <span className="font-figures bg-accent text-accent-foreground inline-flex h-6 min-w-16 items-center justify-center rounded-md px-2 text-xs font-medium">
        {formatDuration(session.durationMinutes)}
      </span>
      <span className="min-w-0 flex-1 truncate @max-xl:basis-full @max-xl:whitespace-normal">
        {session.note ?? <span className="text-muted-foreground">No note</span>}
        <span className="text-muted-foreground ml-2 text-xs">
          {[session.clientName, showAuthor && session.userName].filter(Boolean).join(' · ')}
        </span>
      </span>
      {session.isLogged ? (
        <Badge className="bg-emerald-500/12 text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 />
          In time log
        </Badge>
      ) : (
        canModify &&
        session.clientId && (
          <Button
            variant="outline"
            size="xs"
            disabled={isPending}
            onClick={() =>
              run(() => logWorkSession({ sessionId: session.id }), MESSAGES.TIMER.LOG_SUCCESS)
            }
          >
            <ClipboardPlus />
            Add to time log
          </Button>
        )
      )}
      {canModify && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Session actions"
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
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() =>
                run(
                  () => deleteWorkSession({ sessionId: session.id }),
                  MESSAGES.TIMER.DELETE_SUCCESS,
                )
              }
            >
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  );
}
