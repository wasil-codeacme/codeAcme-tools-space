'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { RoleSelect } from '@/components/platform/team/role-select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { reportActionError } from '@/lib/action-feedback';
import { MESSAGES } from '@/lib/messages';
import { updateUser } from '@/server/actions/user.actions';
import { type UpdateUserInput, updateUserSchema } from '@/server/validators/user.schema';
import type { TeamMemberRow } from '@/types/team';

export function EditMemberDialog({
  member,
  onClose,
}: {
  member: TeamMemberRow;
  onClose: () => void;
}) {
  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { userId: member.id, name: member.name, role: member.role },
  });
  const { errors, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    const result = await updateUser(values);
    if (result.error !== undefined) {
      reportActionError(result.error, form.setError);
      return;
    }
    toast.success(MESSAGES.USER.UPDATE_SUCCESS);
    onClose();
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Edit {member.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} noValidate>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor="edit-member-name">Name</FieldLabel>
              <Input id="edit-member-name" {...form.register('name')} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field>
              <FieldLabel>Role</FieldLabel>
              <Controller
                control={form.control}
                name="role"
                render={({ field }) => <RoleSelect value={field.value} onChange={field.onChange} />}
              />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
