'use client';

import { useTransition } from 'react';
import { UserMinus, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { reportActionError } from '@/lib/action-feedback';
import { initials } from '@/lib/initials';
import { MESSAGES } from '@/lib/messages';
import {
  assignClientMember,
  removeClientMember,
} from '@/server/actions/time-tracking/client.actions';
import type { ClientMemberView } from '@/types/time-tracking';

interface MemberAssignmentsProps {
  clientId: string;
  members: ClientMemberView[];
  users: { id: string; name: string; email: string }[];
}

export function MemberAssignments({ clientId, members, users }: MemberAssignmentsProps) {
  const [isPending, startTransition] = useTransition();
  const assignedIds = new Set(members.map((member) => member.userId));
  const available = users.filter((user) => !assignedIds.has(user.id));

  function change(userId: string, assign: boolean) {
    startTransition(async () => {
      const action = assign ? assignClientMember : removeClientMember;
      const result = await action({ clientId, userId });
      if (result.error !== undefined) {
        reportActionError(result.error);
        return;
      }
      toast.success(assign ? MESSAGES.CLIENT.MEMBER_ADDED : MESSAGES.CLIENT.MEMBER_REMOVED);
    });
  }

  return (
    <div className="space-y-3">
      {members.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nobody is assigned yet. Admins can always log time.
        </p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {members.map((member) => (
            <li key={member.userId} className="flex items-center gap-3 px-3 py-2">
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="bg-accent text-accent-foreground rounded-lg text-xs font-semibold">
                  {initials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-medium">{member.name}</p>
                <p className="text-muted-foreground truncate text-xs">{member.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${member.name}`}
                disabled={isPending}
                onClick={() => change(member.userId, false)}
              >
                <UserMinus />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {available.length > 0 && (
        <Select value="" onValueChange={(userId) => change(userId, true)} disabled={isPending}>
          <SelectTrigger className="w-full sm:w-72" aria-label="Assign a team member">
            <UserPlus className="text-muted-foreground" />
            <SelectValue placeholder="Assign a team member" />
          </SelectTrigger>
          <SelectContent>
            {available.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name} · {user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
