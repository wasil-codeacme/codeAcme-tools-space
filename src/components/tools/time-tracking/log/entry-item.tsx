'use client';

import { CircleHelp, Link2, MoreHorizontal, Pencil, Trash2, UserRound } from 'lucide-react';
import { isOptimisticEntry } from '@/components/tools/time-tracking/log/entry-draft';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDuration } from '@/lib/time-tracking/duration';
import { cn } from '@/lib/utils';
import type { TimeEntryView } from '@/types/time-tracking';

interface EntryItemProps {
  entry: TimeEntryView;
  canModify: boolean;
  showAuthor: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function EntryItem({ entry, canModify, showAuthor, onEdit, onDelete }: EntryItemProps) {
  const isSaving = isOptimisticEntry(entry);

  return (
    <li
      className={cn(
        'group hover:bg-muted/60 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors motion-safe:duration-300',
        isSaving && 'opacity-60',
      )}
    >
      <span className="font-figures bg-accent text-accent-foreground mt-0.5 inline-flex h-6 min-w-14 items-center justify-center rounded-md px-2 text-xs font-medium">
        {formatDuration(entry.durationMinutes)}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm leading-6 break-words">{entry.task}</p>
        <div className="flex flex-wrap items-center gap-1.5 empty:hidden">
          {entry.categoryName && <Badge variant="secondary">{entry.categoryName}</Badge>}
          {entry.needsReview && (
            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300">
              <CircleHelp />
              Needs review
            </Badge>
          )}
          {entry.requestedBy && (
            <Badge variant="outline">
              <UserRound />
              {entry.requestedBy}
            </Badge>
          )}
          {entry.link && (
            <a
              href={entry.link}
              target="_blank"
              rel="noreferrer"
              className="text-primary inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline"
            >
              <Link2 className="size-3" />
              Link
            </a>
          )}
          {showAuthor && <span className="text-muted-foreground text-xs">by {entry.userName}</span>}
        </div>
      </div>
      {canModify && !isSaving && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Entry actions"
              className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 max-sm:opacity-100"
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
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  );
}
