'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ClientForm } from '@/components/tools/time-tracking/clients/client-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { reportActionError } from '@/lib/action-feedback';
import { MESSAGES } from '@/lib/messages';
import { ROUTES } from '@/lib/routes';
import { createClient } from '@/server/actions/time-tracking/client.actions';

export function CreateClientDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          New client
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">New client</DialogTitle>
          <DialogDescription>
            You can add categories and assign team members on the next screen.
          </DialogDescription>
        </DialogHeader>
        <ClientForm
          defaultValues={{ name: '', contactName: '', monthlyLimitHours: '' }}
          submitLabel="Create client"
          onSubmit={async (values) => {
            const result = await createClient(values);
            if (result.error !== undefined) {
              reportActionError(result.error);
              return false;
            }
            toast.success(MESSAGES.CLIENT.CREATE_SUCCESS);
            setOpen(false);
            router.push(ROUTES.TOOLS.TIME_TRACKING.CLIENT(result.data.id));
            return true;
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
