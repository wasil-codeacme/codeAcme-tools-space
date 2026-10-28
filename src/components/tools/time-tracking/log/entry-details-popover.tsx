'use client';

import { Ellipsis } from 'lucide-react';
import { Controller, type UseFormReturn, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { EntryFormValues } from '@/server/validators/time-tracking/time-entry.schema';

// The sheet's optional columns (requested by, notes/link) plus the "??" flag, out of the way of
// the fast duration + task flow.
export function EntryDetailsPopover({ form }: { form: UseFormReturn<EntryFormValues> }) {
  const [requestedBy, link, needsReview] = useWatch({
    control: form.control,
    name: ['requestedBy', 'link', 'needsReview'],
  });
  const hasDetails = Boolean(requestedBy || link || needsReview);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="More details"
          className="relative"
        >
          <Ellipsis />
          {hasDetails && (
            <span className="bg-primary ring-background absolute -top-0.5 -right-0.5 size-2 rounded-full ring-2" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="entry-requested-by">Requested by</FieldLabel>
            <Input
              id="entry-requested-by"
              placeholder="e.g. Anna"
              {...form.register('requestedBy')}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="entry-link">Link</FieldLabel>
            <Input
              id="entry-link"
              type="url"
              placeholder="Ticket, event or doc URL"
              {...form.register('link')}
            />
          </Field>
          <Field orientation="horizontal">
            <Controller
              control={form.control}
              name="needsReview"
              render={({ field }) => (
                <Checkbox
                  id="entry-needs-review"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              )}
            />
            <FieldLabel htmlFor="entry-needs-review" className="font-normal">
              Needs review: I am not sure about this time
            </FieldLabel>
          </Field>
        </FieldGroup>
      </PopoverContent>
    </Popover>
  );
}
