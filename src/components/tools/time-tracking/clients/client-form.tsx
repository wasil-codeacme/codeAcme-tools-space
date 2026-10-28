'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  type ClientFields,
  type ClientFieldsInput,
  clientFieldsSchema,
} from '@/server/validators/time-tracking/client.schema';

export interface ClientFormValues {
  name: string;
  contactName: string;
  monthlyLimitHours: string;
}

interface ClientFormProps {
  defaultValues: ClientFormValues;
  submitLabel: string;
  onSubmit: (values: ClientFields) => Promise<boolean>;
}

export function ClientForm({ defaultValues, submitLabel, onSubmit }: ClientFormProps) {
  const form = useForm<ClientFieldsInput, unknown, ClientFields>({
    resolver: zodResolver(clientFieldsSchema),
    defaultValues,
  });
  const { errors, isSubmitting, isDirty } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    if (await onSubmit(values)) {
      form.reset(form.getValues());
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup>
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor="client-name">Client name</FieldLabel>
          <Input
            id="client-name"
            autoComplete="off"
            aria-invalid={Boolean(errors.name)}
            {...form.register('name')}
          />
          <FieldError errors={[errors.name]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="client-contact">Contact</FieldLabel>
          <Input
            id="client-contact"
            placeholder="e.g. Anna & Jo"
            autoComplete="off"
            {...form.register('contactName')}
          />
        </Field>
        <Field data-invalid={Boolean(errors.monthlyLimitHours)}>
          <FieldLabel htmlFor="client-limit">Monthly limit</FieldLabel>
          <InputGroup className="max-w-48">
            <InputGroupInput
              id="client-limit"
              inputMode="decimal"
              placeholder="No limit"
              className="font-figures"
              aria-invalid={Boolean(errors.monthlyLimitHours)}
              {...form.register('monthlyLimitHours')}
            />
            <InputGroupAddon align="inline-end">hours</InputGroupAddon>
          </InputGroup>
          <FieldDescription>Retainer cap. Leave blank if the client has no limit.</FieldDescription>
          <FieldError errors={[errors.monthlyLimitHours]} />
        </Field>
        <div>
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
