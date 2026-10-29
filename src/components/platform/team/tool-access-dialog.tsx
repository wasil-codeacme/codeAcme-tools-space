'use client';

import { useOptimistic, useTransition } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { type ToolAccess, type ToolId, grantableTools } from '@/config/tools';
import { ToolAccessLevel } from '@/generated/prisma/enums';
import { reportActionError } from '@/lib/action-feedback';
import { MESSAGES } from '@/lib/messages';
import { setToolAccess } from '@/server/actions/user.actions';
import { NO_TOOL_ACCESS } from '@/server/validators/user.schema';
import type { TeamMemberRow } from '@/types/team';

type LevelChoice = typeof NO_TOOL_ACCESS | ToolAccessLevel;

const LEVEL_OPTIONS: { value: LevelChoice; label: string }[] = [
  { value: NO_TOOL_ACCESS, label: 'No access' },
  { value: ToolAccessLevel.VIEW, label: 'View' },
  { value: ToolAccessLevel.EDIT, label: 'Edit' },
];

const LEVEL_HINTS: Record<string, string> = {
  'time-tracking': 'View sees the hours; Edit can log and change their own time.',
  accounts: 'View sees what exists and where it lives; Edit can reveal, add and change secrets.',
  'work-timer': 'Edit can run the timer and save sessions.',
};

const SELECTED_TOGGLE = 'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground';

function isLevelChoice(value: string): value is LevelChoice {
  return LEVEL_OPTIONS.some((option) => option.value === value);
}

export function ToolAccessDialog({
  member,
  onClose,
}: {
  member: TeamMemberRow;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [access, setOptimisticAccess] = useOptimistic(
    member.toolAccess,
    (current: ToolAccess, change: { toolId: ToolId; level: LevelChoice }) => {
      const next = { ...current };
      if (change.level === NO_TOOL_ACCESS) {
        delete next[change.toolId];
      } else {
        next[change.toolId] = change.level;
      }
      return next;
    },
  );

  function change(toolId: ToolId, level: LevelChoice) {
    startTransition(async () => {
      setOptimisticAccess({ toolId, level });
      const result = await setToolAccess({ userId: member.id, toolId, level });
      if (result.error !== undefined) {
        reportActionError(result.error);
        return;
      }
      toast.success(MESSAGES.USER.ACCESS_UPDATED);
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tool access for {member.name}</DialogTitle>
          <DialogDescription>
            Changes apply on their next click. Which clients they see is set per client under Time
            Tracking › Clients.
          </DialogDescription>
        </DialogHeader>
        <ul className="divide-y rounded-xl border" aria-busy={isPending}>
          {grantableTools().map((tool) => (
            <li key={tool.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="bg-accent text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                  <tool.icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{tool.name}</span>
                  <span className="text-muted-foreground block text-xs">
                    {LEVEL_HINTS[tool.id]}
                  </span>
                </span>
              </div>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={access[tool.id as ToolId] ?? NO_TOOL_ACCESS}
                onValueChange={(value) => isLevelChoice(value) && change(tool.id as ToolId, value)}
                aria-label={`${tool.name} access`}
              >
                {LEVEL_OPTIONS.map((option) => (
                  <ToggleGroupItem
                    key={option.value}
                    value={option.value}
                    className={SELECTED_TOGGLE}
                  >
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
