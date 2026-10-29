'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, MailCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { reportActionError } from '@/lib/action-feedback';
import { MESSAGES } from '@/lib/messages';
import { ROUTES } from '@/lib/routes';
import { requestPasswordReset } from '@/server/actions/auth.actions';
import {
  type RequestPasswordResetInput,
  requestPasswordResetSchema,
} from '@/server/validators/auth.schema';

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [isSent, setIsSent] = useState(false);
  const form = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: { email: '' },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await requestPasswordReset(values);
      if (result.error !== undefined) {
        reportActionError(result.error, form.setError);
        return;
      }
      setIsSent(true);
    });
  });

  if (isSent) {
    return (
      <div className="space-y-5">
        <div className="bg-accent text-accent-foreground flex gap-3 rounded-xl p-4 text-sm">
          <MailCheck className="mt-0.5 size-4 shrink-0" />
          <p>{MESSAGES.AUTH.RESET_REQUESTED}</p>
        </div>
        <Button variant="outline" className="w-full" asChild>
          <Link href={ROUTES.AUTH.LOGIN}>Back to sign in</Link>
        </Button>
      </div>
    );
  }

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
            placeholder="you@codeacme.com"
            aria-invalid={Boolean(errors.email)}
            {...form.register('email')}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          Email me a reset link
        </Button>
        <Link
          href={ROUTES.AUTH.LOGIN}
          className="text-muted-foreground hover:text-foreground text-center text-sm"
        >
          Back to sign in
        </Link>
      </FieldGroup>
    </form>
  );
}
