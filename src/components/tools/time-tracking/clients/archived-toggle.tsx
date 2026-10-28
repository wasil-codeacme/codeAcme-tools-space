'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSearchParamNavigation } from '@/hooks/use-search-param-navigation';

export function ArchivedToggle({ showArchived }: { showArchived: boolean }) {
  const { navigate } = useSearchParamNavigation();
  return (
    <div className="flex items-center gap-2">
      <Switch
        id="show-archived"
        checked={showArchived}
        onCheckedChange={(checked) => navigate({ archived: checked ? '1' : null })}
      />
      <Label htmlFor="show-archived" className="text-muted-foreground text-sm">
        Show archived clients
      </Label>
    </div>
  );
}
