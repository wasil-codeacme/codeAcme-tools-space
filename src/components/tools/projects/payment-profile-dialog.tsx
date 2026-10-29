'use client';

import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Textarea } from '@/components/ui/textarea';
import { reportActionError } from '@/lib/action-feedback';
import { MESSAGES } from '@/lib/messages';
import {
  createPaymentProfile,
  updatePaymentProfile,
} from '@/server/actions/projects/projects.actions';
import {
  type PaymentProfileForm,
  paymentProfileFieldsSchema,
} from '@/server/validators/projects/projects.schema';
import type { PaymentProfileView } from '@/types/projects';

function defaults(profile: PaymentProfileView | null): PaymentProfileForm {
  return {
    label: profile?.label ?? '',
    details: profile?.details ?? '',
    paymentLink: profile?.paymentLink ?? null,
    isFavorite: profile?.isFavorite ?? false,
  };
}

export function PaymentProfileDialog({
  profile,
  trigger,
}: {
  profile?: PaymentProfileView;
  trigger?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useForm<PaymentProfileForm>({
    resolver: zodResolver(paymentProfileFieldsSchema),
    defaultValues: defaults(profile ?? null),
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = profile
        ? await updatePaymentProfile({ ...values, paymentProfileId: profile.id })
        : await createPaymentProfile(values);
      if (result.error !== undefined) {
        reportActionError(result.error, form.setError);
        return;
      }
      toast.success(MESSAGES.PAYMENT_PROFILE.SAVE_SUCCESS);
      setIsOpen(false);
      if (!profile) {
        form.reset(defaults(null));
      }
    });
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus />
            Add payment details
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{profile ? `Edit ${profile.label}` : 'Add payment details'}</DialogTitle>
          <DialogDescription>
            Copied onto each invoice when it is created, so later edits never change a sent invoice.
          </DialogDescription>
        </DialogHeader>
        <form id="payment-profile-form" onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.label)}>
              <FieldLabel htmlFor="profile-label">Name</FieldLabel>
              <Input id="profile-label" placeholder="Wise USD" {...form.register('label')} />
              <FieldError errors={[errors.label]} />
            </Field>
            <Field data-invalid={Boolean(errors.details)}>
              <FieldLabel htmlFor="profile-details">Account details</FieldLabel>
              <Textarea
                id="profile-details"
                rows={5}
                placeholder={'Account holder: CodeAcme LLC\nAccount number: …\nRouting number: …'}
                {...form.register('details')}
              />
              <FieldError errors={[errors.details]} />
            </Field>
            <Field data-invalid={Boolean(errors.paymentLink)}>
              <FieldLabel htmlFor="profile-link">Payment link (optional)</FieldLabel>
              <Input
                id="profile-link"
                type="url"
                placeholder="https://wise.com/pay/…"
                {...form.register('paymentLink', {
                  // Also runs on the default value, which is null when no link is saved.
                  setValueAs: (value: string | null) => value?.trim() || null,
                })}
              />
              <FieldError errors={[errors.paymentLink]} />
            </Field>
            <Controller
              control={form.control}
              name="isFavorite"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="profile-favorite"
                    checked={field.value ?? false}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  <FieldLabel htmlFor="profile-favorite">
                    Favourite: offer it first on new invoices
                  </FieldLabel>
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="payment-profile-form" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
