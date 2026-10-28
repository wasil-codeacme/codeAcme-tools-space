'use client';

import { useTransition } from 'react';
import { Archive, ArchiveRestore } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { reportActionError } from '@/lib/action-feedback';
import { MESSAGES } from '@/lib/messages';
import { setClientArchived } from '@/server/actions/time-tracking/client.actions';

export function ClientArchiveButton({
  clientId,
  isArchived,
}: {
  clientId: string;
  isArchived: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const result = await setClientArchived({ clientId, isArchived: !isArchived });
      if (result.error !== undefined) {
        reportActionError(result.error);
        return;
      }
      toast.success(isArchived ? MESSAGES.CLIENT.RESTORE_SUCCESS : MESSAGES.CLIENT.ARCHIVE_SUCCESS);
    });
  }

  if (isArchived) {
    return (
      <Button variant="outline" onClick={toggle} disabled={isPending}>
        <ArchiveRestore />
        Restore client
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={isPending}>
          <Archive />
          Archive
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive this client?</AlertDialogTitle>
          <AlertDialogDescription>
            The team can no longer log time against it. Existing hours stay in the overview and
            reports, and you can restore it at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={toggle}>Archive client</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
