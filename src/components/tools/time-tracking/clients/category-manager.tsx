'use client';

import { type FormEvent, useState, useTransition } from 'react';
import { Archive, ArchiveRestore, Check, Pencil, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { reportActionError } from '@/lib/action-feedback';
import { MESSAGES } from '@/lib/messages';
import { cn } from '@/lib/utils';
import {
  createCategory,
  renameCategory,
  setCategoryArchived,
} from '@/server/actions/time-tracking/client.actions';
import type { ActionResponse } from '@/types';
import type { CategoryOption } from '@/types/time-tracking';

interface CategoryManagerProps {
  clientId: string;
  categories: CategoryOption[];
}

export function CategoryManager({ clientId, categories }: CategoryManagerProps) {
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(
    action: () => Promise<ActionResponse<unknown>>,
    successMessage: string,
    onDone?: () => void,
  ) {
    startTransition(async () => {
      const result = await action();
      if (result.error !== undefined) {
        reportActionError(result.error);
        return;
      }
      toast.success(successMessage);
      onDone?.();
    });
  }

  function add(event: FormEvent) {
    event.preventDefault();
    run(
      () => createCategory({ clientId, name: newName }),
      MESSAGES.CATEGORY.CREATE_SUCCESS,
      () => setNewName(''),
    );
  }

  function saveRename(event: FormEvent) {
    event.preventDefault();
    if (!editing) {
      return;
    }
    run(
      () => renameCategory({ categoryId: editing.id, name: editing.name }),
      MESSAGES.CATEGORY.UPDATE_SUCCESS,
      () => setEditing(null),
    );
  }

  return (
    <div className="space-y-3">
      {categories.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No categories yet. Entries can still be logged without one.
        </p>
      )}
      <ul className="divide-y rounded-xl border">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center gap-2 px-3 py-2">
            {editing?.id === category.id ? (
              <form onSubmit={saveRename} className="flex flex-1 items-center gap-2">
                <Input
                  value={editing.name}
                  onChange={(event) => setEditing({ id: category.id, name: event.target.value })}
                  autoFocus
                  aria-label="Category name"
                />
                <Button type="submit" size="icon-sm" disabled={isPending} aria-label="Save">
                  <Check />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setEditing(null)}
                  aria-label="Cancel"
                >
                  <X />
                </Button>
              </form>
            ) : (
              <>
                <span
                  className={cn(
                    'flex-1 text-sm',
                    category.isArchived && 'text-muted-foreground line-through',
                  )}
                >
                  {category.name}
                </span>
                {category.isArchived && <Badge variant="outline">Archived</Badge>}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Rename"
                  onClick={() => setEditing({ id: category.id, name: category.name })}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={category.isArchived ? 'Restore' : 'Archive'}
                  disabled={isPending}
                  onClick={() =>
                    run(
                      () =>
                        setCategoryArchived({
                          categoryId: category.id,
                          isArchived: !category.isArchived,
                        }),
                      category.isArchived
                        ? MESSAGES.CATEGORY.RESTORE_SUCCESS
                        : MESSAGES.CATEGORY.ARCHIVE_SUCCESS,
                    )
                  }
                >
                  {category.isArchived ? <ArchiveRestore /> : <Archive />}
                </Button>
              </>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="flex gap-2">
        <Input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="New category, e.g. Small fixes"
          aria-label="New category name"
        />
        <Button type="submit" variant="outline" disabled={isPending || newName.trim() === ''}>
          <Plus />
          Add
        </Button>
      </form>
    </div>
  );
}
