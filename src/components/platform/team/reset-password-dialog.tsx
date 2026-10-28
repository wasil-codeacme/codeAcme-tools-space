'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PasswordField } from '@/components/platform/team/password-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { reportActionError } from '@/lib/action-feedback';
import { generatePassword } from '@/lib/generate-password';
import { MESSAGES } from '@/lib/messages';
import { resetUserPassword } from '@/server/actions/user.actions';
import type { TeamMemberRow } from '@/types/team';

export function ResetPasswordDialog({
  member,
  onClose,
}: {
  member: TeamMemberRow;
  onClose: () => void;
}) {
  const [password, setPassword] = useState(generatePassword);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await resetUserPassword({ userId: member.id, password });
      if (result.error !== undefined) {
        setError(typeof result.error === 'string' ? undefined : result.error.password?.[0]);
        reportActionError(result.error);
        return;
      }
      toast.success(MESSAGES.USER.PASSWORD_RESET_SUCCESS, {
        description: `${member.name} has been signed out everywhere.`,
      });
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Set a temporary password</DialogTitle>
          <DialogDescription>
            {member.name} is signed out of every device and signs in again with this password.
          </DialogDescription>
        </DialogHeader>
        <PasswordField
          id="reset-password"
          label="Temporary password"
          value={password}
          onChange={setPassword}
          error={error}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            Set password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
