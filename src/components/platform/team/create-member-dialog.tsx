'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, UserPlus } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { PasswordField } from '@/components/platform/team/password-field';
import { RoleSelect } from '@/components/platform/team/role-select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Role } from '@/generated/prisma/enums';
import { reportActionError } from '@/lib/action-feedback';
import { generatePassword } from '@/lib/generate-password';
import { MESSAGES } from '@/lib/messages';
import { createUser } from '@/server/actions/user.actions';
import { type CreateUserInput, createUserSchema } from '@/server/validators/user.schema';

export function CreateMemberDialog() {
  const [open, setOpen] = useState(false);
  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '', role: Role.MEMBER, password: '' },
  });

  // Generated on open rather than during render, so server and client markup always match.
  function changeOpen(next: boolean) {
    if (next && form.getValues('password') === '') {
      form.setValue('password', generatePassword());
    }
    setOpen(next);
  }
  const { errors, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    const result = await createUser(values);
    if (result.error !== undefined) {
      reportActionError(result.error, form.setError);
      return;
    }
    toast.success(MESSAGES.USER.CREATE_SUCCESS, {
      description: 'Share the temporary password with them privately.',
    });
    form.reset({ name: '', email: '', role: Role.MEMBER, password: '' });
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus />
          Add member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Add a team member</DialogTitle>
          <DialogDescription>
            They sign in with this email and the temporary password, then change it under Account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor="member-name">Name</FieldLabel>
              <Input id="member-name" autoComplete="off" {...form.register('name')} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field data-invalid={Boolean(errors.email)}>
              <FieldLabel htmlFor="member-email">Email</FieldLabel>
              <Input
                id="member-email"
                type="email"
                autoComplete="off"
                {...form.register('email')}
              />
              <FieldError errors={[errors.email]} />
            </Field>
            <Field>
              <FieldLabel>Role</FieldLabel>
              <Controller
                control={form.control}
                name="role"
                render={({ field }) => <RoleSelect value={field.value} onChange={field.onChange} />}
              />
            </Field>
            <Controller
              control={form.control}
              name="password"
              render={({ field }) => (
                <PasswordField
                  id="member-password"
                  label="Temporary password"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.password?.message}
                />
              )}
            />
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Add member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
