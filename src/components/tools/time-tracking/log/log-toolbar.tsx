'use client';

import { Building2, ClipboardPaste, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ClientMemberView } from '@/types/time-tracking';

export const ALL_MEMBERS = 'all';

interface LogToolbarProps {
  clients: readonly { id: string; name: string }[];
  clientId: string;
  members: readonly ClientMemberView[];
  selectedMemberId: string | null;
  isAdmin: boolean;
  onClientChange: (clientId: string) => void;
  onMemberChange: (memberId: string | null) => void;
  onPaste: () => void;
}

export function LogToolbar({
  clients,
  clientId,
  members,
  selectedMemberId,
  isAdmin,
  onClientChange,
  onMemberChange,
  onPaste,
}: LogToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
        <Select value={clientId} onValueChange={onClientChange}>
          <SelectTrigger
            className="bg-card w-full font-medium sm:w-auto sm:min-w-56"
            aria-label="Client"
          >
            <Building2 className="text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isAdmin && (
          <Select
            value={selectedMemberId ?? ALL_MEMBERS}
            onValueChange={(value) => onMemberChange(value === ALL_MEMBERS ? null : value)}
          >
            <SelectTrigger
              className="bg-card w-full sm:w-auto sm:min-w-44"
              aria-label="Team member"
            >
              <UsersRound className="text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_MEMBERS}>Everyone</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.userId} value={member.userId}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <Button variant="outline" onClick={onPaste} className="bg-card w-full sm:w-auto">
        <ClipboardPaste />
        Paste from notes
      </Button>
    </div>
  );
}
