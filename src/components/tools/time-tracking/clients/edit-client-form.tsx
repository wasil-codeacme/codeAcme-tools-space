'use client';

import { toast } from 'sonner';
import { ClientForm } from '@/components/tools/time-tracking/clients/client-form';
import { reportActionError } from '@/lib/action-feedback';
import { MESSAGES } from '@/lib/messages';
import { minutesToHours } from '@/lib/time-tracking/duration';
import { updateClient } from '@/server/actions/time-tracking/client.actions';
import type { ClientSummary } from '@/types/time-tracking';

type EditableClient = Pick<ClientSummary, 'id' | 'name' | 'contactName' | 'monthlyLimitMinutes'>;

export function EditClientForm({ client }: { client: EditableClient }) {
  return (
    <ClientForm
      defaultValues={{
        name: client.name,
        contactName: client.contactName ?? '',
        monthlyLimitHours:
          client.monthlyLimitMinutes === null
            ? ''
            : String(minutesToHours(client.monthlyLimitMinutes)),
      }}
      submitLabel="Save changes"
      onSubmit={async (values) => {
        const result = await updateClient({ ...values, clientId: client.id });
        if (result.error !== undefined) {
          reportActionError(result.error);
          return false;
        }
        toast.success(MESSAGES.CLIENT.UPDATE_SUCCESS);
        return true;
      }}
    />
  );
}
