import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { ROUTES } from '@/lib/routes';

export function NoClientsState({ isAdmin }: { isAdmin: boolean }) {
  return (
    <Empty className="bg-card/60 rounded-2xl border border-dashed py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Building2 />
        </EmptyMedia>
        <EmptyTitle>No clients yet</EmptyTitle>
        <EmptyDescription>
          {isAdmin
            ? 'Create a client and assign your team to start logging time.'
            : 'You have not been assigned to a client yet. Ask an admin to add you.'}
        </EmptyDescription>
      </EmptyHeader>
      {isAdmin && (
        <EmptyContent>
          <Button asChild>
            <Link href={ROUTES.TOOLS.TIME_TRACKING.CLIENTS}>Manage clients</Link>
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
