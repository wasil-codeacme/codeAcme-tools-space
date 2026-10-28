'use client';

import { useState, useTransition } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { NO_CLIENT } from '@/components/tools/work-timer/timer-panel';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { reportActionError } from '@/lib/action-feedback';
import { MESSAGES } from '@/lib/messages';
import { updateWorkSession } from '@/server/actions/work-timer/work-session.actions';
import type { WorkSessionHistoryItem } from '@/types/work-timer';

// <input type="datetime-local"> works in the browser's local time; convert at the edges.
const LOCAL_INPUT_FORMAT = "yyyy-MM-dd'T'HH:mm";

interface EditSessionDialogProps {
  session: WorkSessionHistoryItem;
  clients: { id: string; name: string }[];
  onClose: () => void;
}

export function EditSessionDialog({ session, clients, onClose }: EditSessionDialogProps) {
  const [clientId, setClientId] = useState(session.clientId ?? NO_CLIENT);
  const [note, setNote] = useState(session.note ?? '');
  const [startedAt, setStartedAt] = useState(
    format(new Date(session.startedAt), LOCAL_INPUT_FORMAT),
  );
  const [endedAt, setEndedAt] = useState(
    format(new Date(session.endedAt ?? session.startedAt), LOCAL_INPUT_FORMAT),
  );
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await updateWorkSession({
        sessionId: session.id,
        clientId: clientId === NO_CLIENT ? null : clientId,
        note,
        startedAt: new Date(startedAt).toISOString(),
        endedAt: new Date(endedAt).toISOString(),
      });
      if (result.error !== undefined) {
        reportActionError(result.error);
        return;
      }
      toast.success(MESSAGES.TIMER.UPDATE_SUCCESS);
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Edit session</DialogTitle>
          <DialogDescription>Fix the times if you forgot to press start or stop.</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="session-start">Started</FieldLabel>
              <Input
                id="session-start"
                type="datetime-local"
                value={startedAt}
                onChange={(event) => setStartedAt(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="session-end">Stopped</FieldLabel>
              <Input
                id="session-end"
                type="datetime-local"
                value={endedAt}
                onChange={(event) => setEndedAt(event.target.value)}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel>Client</FieldLabel>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="w-full" aria-label="Client">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CLIENT}>No client</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="session-note">Note</FieldLabel>
            <Input
              id="session-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
