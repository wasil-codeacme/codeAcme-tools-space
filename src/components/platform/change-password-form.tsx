'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { reportActionError } from '@/lib/action-feedback';
import { MIN_PASSWORD_LENGTH } from '@/lib/constants';
import { MESSAGES } from '@/lib/messages';
import { changePassword } from '@/server/actions/auth.actions';
import { type ChangePasswordInput, changePasswordSchema } from '@/server/validators/auth.schema';

const EMPTY_VALUES: ChangePasswordInput = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export function ChangePasswordForm() {
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY_VALUES,
  });
  const { errors, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    const result = await changePassword(values);
    if (result.error !== undefined) {
      reportActionError(result.error, form.setError);
      return;
    }
    toast.success(MESSAGES.AUTH.PASSWORD_CHANGED);
    form.reset(EMPTY_VALUES);
  });

  return (
    <form onSubmit={submit} noValidate className="max-w-sm">
      <FieldGroup>
        <Field data-invalid={Boolean(errors.currentPassword)}>
          <FieldLabel htmlFor="current-password">Current password</FieldLabel>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            {...form.register('currentPassword')}
          />
          <FieldError errors={[errors.currentPassword]} />
        </Field>
        <Field data-invalid={Boolean(errors.newPassword)}>
          <FieldLabel htmlFor="new-password">New password</FieldLabel>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            {...form.register('newPassword')}
          />
          <FieldDescription>At least {MIN_PASSWORD_LENGTH} characters.</FieldDescription>
          <FieldError errors={[errors.newPassword]} />
        </Field>
        <Field data-invalid={Boolean(errors.confirmPassword)}>
          <FieldLabel htmlFor="confirm-password">Confirm new password</FieldLabel>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            {...form.register('confirmPassword')}
          />
          <FieldError errors={[errors.confirmPassword]} />
        </Field>
        <div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Update password
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
