'use client';

import { Building2, ClipboardPaste, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ALL_SCOPES, INTERNAL_SCOPE, INTERNAL_SCOPE_LABEL } from '@/lib/accounts/labels';

interface AccountsToolbarProps {
  clients: { id: string; name: string }[];
  isAdmin: boolean;
  scope: string;
  search: string;
  showArchived: boolean;
  onScopeChange: (scope: string) => void;
  onSearchChange: (search: string) => void;
  onShowArchivedChange: (checked: boolean) => void;
  onCreate: () => void;
  onImport: () => void;
}

export function AccountsToolbar(props: AccountsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={props.scope} onValueChange={props.onScopeChange}>
          <SelectTrigger className="bg-card min-w-52 font-medium" aria-label="Client">
            <Building2 className="text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SCOPES}>All accounts</SelectItem>
            {props.clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
            {props.isAdmin && (
              <SelectItem value={INTERNAL_SCOPE}>{INTERNAL_SCOPE_LABEL}</SelectItem>
            )}
          </SelectContent>
        </Select>
        <InputGroup className="bg-card w-64">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            value={props.search}
            onChange={(event) => props.onSearchChange(event.target.value)}
            placeholder="Search tools, links, logins"
            aria-label="Search accounts"
          />
        </InputGroup>
        {props.isAdmin && (
          <div className="flex items-center gap-2 pl-1">
            <Switch
              id="accounts-archived"
              checked={props.showArchived}
              onCheckedChange={props.onShowArchivedChange}
            />
            <Label htmlFor="accounts-archived" className="text-muted-foreground text-sm">
              Archived
            </Label>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="bg-card" onClick={props.onImport}>
          <ClipboardPaste />
          Paste from sheet
        </Button>
        <Button onClick={props.onCreate}>
          <Plus />
          New account
        </Button>
      </div>
    </div>
  );
}
