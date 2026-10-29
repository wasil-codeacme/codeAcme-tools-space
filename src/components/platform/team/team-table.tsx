'use client';

import { useState, useTransition } from 'react';
import { KeyRound, LayoutGrid, MoreHorizontal, Pencil, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { EditMemberDialog } from '@/components/platform/team/edit-member-dialog';
import { ResetPasswordDialog } from '@/components/platform/team/reset-password-dialog';
import { ToolAccessDialog } from '@/components/platform/team/tool-access-dialog';
import { ROLE_LABELS } from '@/components/platform/team/role-select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { grantableTools } from '@/config/tools';
import { Role, ToolAccessLevel } from '@/generated/prisma/enums';
import { reportActionError } from '@/lib/action-feedback';
import { initials } from '@/lib/initials';
import { MESSAGES } from '@/lib/messages';
import { cn } from '@/lib/utils';
import { setUserActive } from '@/server/actions/user.actions';
import type { TeamMemberRow } from '@/types/team';

type OpenDialog = { kind: 'edit' | 'password' | 'access'; member: TeamMemberRow } | null;

function accessSummary(member: TeamMemberRow): string {
  if (member.role === Role.ADMIN) {
    return 'Every tool';
  }
  const granted = grantableTools().flatMap((tool) => {
    const level = member.toolAccess[tool.id as keyof TeamMemberRow['toolAccess']];
    if (!level) {
      return [];
    }
    return [level === ToolAccessLevel.VIEW ? `${tool.name} (view)` : tool.name];
  });
  return granted.length > 0 ? granted.join(' · ') : 'No tools yet';
}

export function TeamTable({
  users,
  currentUserId,
}: {
  users: TeamMemberRow[];
  currentUserId: string;
}) {
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const [isPending, startTransition] = useTransition();

  function toggleActive(member: TeamMemberRow) {
    startTransition(async () => {
      const result = await setUserActive({ userId: member.id, isActive: !member.isActive });
      if (result.error !== undefined) {
        reportActionError(result.error);
        return;
      }
      toast.success(MESSAGES.USER.UPDATE_SUCCESS);
    });
  }

  return (
    <>
      <ul className="ca-glow bg-card divide-y overflow-hidden rounded-2xl border">
        {users.map((member) => {
          const isSelf = member.id === currentUserId;
          return (
            <li
              key={member.id}
              className={cn('flex items-center gap-3 px-4 py-3', !member.isActive && 'opacity-60')}
            >
              <Avatar className="size-9 rounded-lg">
                <AvatarFallback className="bg-accent text-accent-foreground rounded-lg text-xs font-semibold">
                  {initials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-medium">
                  {member.name}
                  {isSelf && <span className="text-muted-foreground ml-1.5 text-xs">(you)</span>}
                </p>
                <p className="text-muted-foreground truncate text-xs">{member.email}</p>
                <p className="text-muted-foreground/80 mt-0.5 truncate text-xs">
                  {accessSummary(member)}
                </p>
              </div>
              <Badge variant={member.role === Role.ADMIN ? 'default' : 'secondary'}>
                {ROLE_LABELS[member.role]}
              </Badge>
              {!member.isActive && <Badge variant="outline">Deactivated</Badge>}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Actions for ${member.name}`}
                    disabled={isPending}
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setDialog({ kind: 'edit', member })}>
                    <Pencil />
                    Edit name & role
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={member.role === Role.ADMIN}
                    onSelect={() => setDialog({ kind: 'access', member })}
                  >
                    <LayoutGrid />
                    Tool access
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={isSelf}
                    onSelect={() => setDialog({ kind: 'password', member })}
                  >
                    <KeyRound />
                    Set temporary password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={isSelf}
                    variant={member.isActive ? 'destructive' : 'default'}
                    onSelect={() => toggleActive(member)}
                  >
                    {member.isActive ? <UserX /> : <UserCheck />}
                    {member.isActive ? 'Deactivate' : 'Reactivate'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          );
        })}
      </ul>
      {dialog?.kind === 'edit' && (
        <EditMemberDialog member={dialog.member} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === 'access' && (
        <ToolAccessDialog
          member={users.find((user) => user.id === dialog.member.id) ?? dialog.member}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'password' && (
        <ResetPasswordDialog member={dialog.member} onClose={() => setDialog(null)} />
      )}
    </>
  );
}
