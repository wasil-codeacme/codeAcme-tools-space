'use client';

import { useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { reportActionError } from '@/lib/action-feedback';
import { MESSAGES } from '@/lib/messages';
import { updateOwnName } from '@/server/actions/user.actions';
import { type UpdateOwnNameInput, updateOwnNameSchema } from '@/server/validators/user.schema';

export function ProfileNameForm({ name }: { name: string }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<UpdateOwnNameInput>({
    resolver: zodResolver(updateOwnNameSchema),
    defaultValues: { name },
  });
  const { errors, isDirty } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await updateOwnName(values);
      if (result.error !== undefined) {
        reportActionError(result.error, form.setError);
        return;
      }
      form.reset({ name: result.data.name });
      toast.success(MESSAGES.USER.NAME_UPDATED);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Field data-invalid={Boolean(errors.name)}>
        <FieldLabel htmlFor="profile-name">Name</FieldLabel>
        <div className="flex max-w-md gap-2">
          <Input
            id="profile-name"
            autoComplete="name"
            // Server-rendered value, so the box is not blank until the form hydrates.
            defaultValue={name}
            aria-invalid={Boolean(errors.name)}
            {...form.register('name')}
          />
          <Button type="submit" disabled={isPending || !isDirty}>
            {isPending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </div>
        <FieldError errors={[errors.name]} />
      </Field>
    </form>
  );
}
