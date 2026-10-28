'use client';

import { useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { reportActionError } from '@/lib/action-feedback';
import { login } from '@/server/actions/auth.actions';
import { type LoginInput, loginSchema } from '@/server/validators/auth.schema';

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await login({ ...values, timeZone });
      if (result?.error) {
        reportActionError(result.error, form.setError);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            aria-invalid={Boolean(errors.email)}
            {...form.register('email')}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field data-invalid={Boolean(errors.password)}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...form.register('password')}
          />
          <FieldError errors={[errors.password]} />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          Sign in
        </Button>
      </FieldGroup>
    </form>
  );
}
