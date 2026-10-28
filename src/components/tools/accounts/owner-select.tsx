'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { INTERNAL_SCOPE, INTERNAL_SCOPE_LABEL } from '@/lib/accounts/labels';

interface OwnerSelectProps {
  value: string;
  onChange: (value: string) => void;
  clients: { id: string; name: string }[];
  isAdmin: boolean;
}

export function OwnerSelect({ value, onChange, clients, isAdmin }: OwnerSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full" aria-label="Belongs to">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {clients.map((client) => (
          <SelectItem key={client.id} value={client.id}>
            {client.name}
          </SelectItem>
        ))}
        {isAdmin && <SelectItem value={INTERNAL_SCOPE}>{INTERNAL_SCOPE_LABEL}</SelectItem>}
      </SelectContent>
    </Select>
  );
}
