'use client';

import { Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSearchParamNavigation } from '@/hooks/use-search-param-navigation';

interface OverviewControlsProps {
  clients: { id: string; name: string }[];
  clientId: string;
  year: number;
}

export function OverviewControls({ clients, clientId, year }: OverviewControlsProps) {
  const { navigate } = useSearchParamNavigation();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Select value={clientId} onValueChange={(value) => navigate({ client: value })}>
        <SelectTrigger className="bg-card min-w-56 font-medium" aria-label="Client">
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
      <div className="bg-card flex items-center gap-1 rounded-xl border p-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Previous year"
          onClick={() => navigate({ year: String(year - 1) })}
        >
          <ChevronLeft />
        </Button>
        <span className="font-figures w-14 text-center text-sm font-medium">{year}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Next year"
          onClick={() => navigate({ year: String(year + 1) })}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
