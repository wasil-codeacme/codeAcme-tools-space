'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Role } from '@/generated/prisma/enums';

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  MEMBER: 'Member',
};

function isRole(value: string): value is Role {
  return value === Role.ADMIN || value === Role.MEMBER;
}

export function RoleSelect({ value, onChange }: { value: Role; onChange: (role: Role) => void }) {
  return (
    <Select value={value} onValueChange={(next) => isRole(next) && onChange(next)}>
      <SelectTrigger className="w-full" aria-label="Role">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={Role.MEMBER}>Member: logs time for assigned clients</SelectItem>
        <SelectItem value={Role.ADMIN}>Admin: manages clients, reports and the team</SelectItem>
      </SelectContent>
    </Select>
  );
}
