'use client';

import type { RefObject } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CornerDownLeft } from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { EntryDetailsPopover } from '@/components/tools/time-tracking/log/entry-details-popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Kbd } from '@/components/ui/kbd';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDuration } from '@/lib/time-tracking/duration';
import { parseDuration } from '@/lib/time-tracking/parse-duration';
import { cn } from '@/lib/utils';
import {
  type EntryFormValues,
  entryFormSchema,
} from '@/server/validators/time-tracking/time-entry.schema';

export const NO_CATEGORY = 'none';

export const EMPTY_ENTRY_FORM: EntryFormValues = {
  duration: '',
  task: '',
  categoryId: NO_CATEGORY,
  requestedBy: '',
  link: '',
  needsReview: false,
};

interface CategoryChoice {
  id: string;
  name: string;
}

interface EntryFormProps {
  mode: 'create' | 'edit';
  categories: readonly CategoryChoice[];
  defaultValues?: EntryFormValues;
  onSubmit: (values: EntryFormValues) => Promise<boolean>;
  onCancel?: () => void;
  durationInputRef?: RefObject<HTMLInputElement | null>;
}

export function EntryForm({
  mode,
  categories,
  defaultValues = EMPTY_ENTRY_FORM,
  onSubmit,
  onCancel,
  durationInputRef,
}: EntryFormProps) {
  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entryFormSchema),
    defaultValues,
  });
  const { errors, isSubmitting } = form.formState;
  const duration = useWatch({ control: form.control, name: 'duration' });
  const parsedMinutes = parseDuration(duration);
  const firstError = errors.duration?.message ?? errors.task?.message ?? errors.link?.message;

  const submit = form.handleSubmit(async (values) => {
    const saved = await onSubmit(values);
    if (saved && mode === 'create') {
      // Keep the category: consecutive items in a day usually share one.
      form.reset({ ...EMPTY_ENTRY_FORM, categoryId: values.categoryId });
      form.setFocus('duration');
    }
  });

  const { ref: registerDurationRef, ...durationField } = form.register('duration');

  return (
    <form
      onSubmit={submit}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && onCancel) {
          onCancel();
        }
      }}
      noValidate
      className={cn(
        'bg-background focus-within:border-ring/60 focus-within:ring-ring/20 rounded-xl border p-2 shadow-xs transition-shadow focus-within:ring-3',
        mode === 'edit' && 'border-primary/40',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="w-32 shrink-0" data-invalid={Boolean(errors.duration)}>
          <InputGroupInput
            {...durationField}
            ref={(element) => {
              registerDurationRef(element);
              if (durationInputRef) {
                durationInputRef.current = element;
              }
            }}
            placeholder="30m"
            aria-label="Duration"
            aria-invalid={Boolean(errors.duration)}
            autoComplete="off"
            autoFocus={mode === 'edit'}
            className="font-figures"
          />
          {parsedMinutes !== null && formatDuration(parsedMinutes) !== duration.trim() && (
            <InputGroupAddon align="inline-end" className="font-figures text-primary text-xs">
              {formatDuration(parsedMinutes)}
            </InputGroupAddon>
          )}
        </InputGroup>
        <Input
          {...form.register('task')}
          placeholder="What did you work on?"
          aria-label="Task"
          aria-invalid={Boolean(errors.task)}
          autoComplete="off"
          className="min-w-48 flex-1"
        />
        {categories.length > 0 && (
          <Controller
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full sm:w-52" aria-label="Category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>No category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}
        <EntryDetailsPopover form={form} />
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {mode === 'create' ? 'Add' : 'Save'}
          <Kbd className="bg-primary-foreground/15 text-primary-foreground">
            <CornerDownLeft />
          </Kbd>
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
      {firstError && <p className="text-destructive px-1 pt-1.5 text-xs">{firstError}</p>}
    </form>
  );
}
