'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Plus, Trash2 } from 'lucide-react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { reportActionError } from '@/lib/action-feedback';
import { MESSAGES } from '@/lib/messages';
import { dollarsToCents, formatMoney, invoiceTotalCents } from '@/lib/projects/invoice-math';
import { ROUTES } from '@/lib/routes';
import { type DateKey, formatDateKey, fromDateKey } from '@/lib/time-tracking/date-key';
import { hoursToMinutes, minutesToHours } from '@/lib/time-tracking/duration';
import { createInvoice } from '@/server/actions/projects/projects.actions';
import {
  type CreateInvoiceForm,
  createInvoiceSchema,
} from '@/server/validators/projects/projects.schema';
import type { PaymentProfileView } from '@/types/projects';

const NO_PROJECT = 'none';
const INVOICE_CURRENCY = 'USD';
const PICKER_DATE_FORMAT = 'yyyy-MM-dd';
const DEFAULT_TERMS =
  'Payment is due within 14 days of the invoice date. Thank you for your business.';

interface ProjectOption {
  id: string;
  clientId: string;
  name: string;
  billedMinutes: number | null;
}

interface InvoiceFormProps {
  clients: { id: string; name: string }[];
  projects: ProjectOption[];
  profiles: PaymentProfileView[];
  issueDate: DateKey;
  dueDate: DateKey;
  initialProjectId: string | null;
}

function projectLine(project: ProjectOption | undefined, rate: number) {
  return {
    description: project ? project.name : '',
    hours: project?.billedMinutes ? minutesToHours(project.billedMinutes) : 1,
    rate,
  };
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: DateKey;
  onChange: (value: DateKey) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start font-normal" aria-label={label}>
          <CalendarIcon className="text-muted-foreground" />
          {formatDateKey(value, 'd MMM yyyy')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={fromDateKey(value)}
          defaultMonth={fromDateKey(value)}
          onSelect={(day) => day && onChange(format(day, PICKER_DATE_FORMAT))}
        />
      </PopoverContent>
    </Popover>
  );
}

export function InvoiceForm({
  clients,
  projects,
  profiles,
  issueDate,
  dueDate,
  initialProjectId,
}: InvoiceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const initialProject = projects.find((project) => project.id === initialProjectId);
  const form = useForm<CreateInvoiceForm>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      clientId: initialProject?.clientId ?? clients[0]?.id ?? '',
      projectId: initialProject?.id ?? null,
      issueDate,
      dueDate,
      paymentProfileId: profiles[0]?.id ?? '',
      terms: DEFAULT_TERMS,
      notes: '',
      lines: [projectLine(initialProject, 0)],
    },
  });
  const { errors } = form.formState;
  const lines = useFieldArray({ control: form.control, name: 'lines' });
  const [clientId, watchedLines] = useWatch({ control: form.control, name: ['clientId', 'lines'] });
  const clientProjects = projects.filter((project) => project.clientId === clientId);
  const totalCents = invoiceTotalCents(
    (watchedLines ?? []).map((line) => ({
      minutes: hoursToMinutes(Number(line?.hours) || 0),
      rateCents: dollarsToCents(Number(line?.rate) || 0),
    })),
  );

  function chooseProject(projectId: string) {
    const project = projects.find((candidate) => candidate.id === projectId);
    form.setValue('projectId', project?.id ?? null);
    if (project) {
      const rate = Number(form.getValues('lines.0.rate')) || 0;
      form.setValue('lines.0', projectLine(project, rate));
    }
  }

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createInvoice(values);
      if (result.error !== undefined) {
        reportActionError(result.error, form.setError);
        return;
      }
      toast.success(MESSAGES.INVOICE.CREATE_SUCCESS(result.data.number));
      router.push(ROUTES.TOOLS.PROJECTS.INVOICES);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="ca-glow bg-card space-y-6 rounded-2xl border p-5 sm:p-6">
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={Boolean(errors.clientId)}>
              <FieldLabel>Client</FieldLabel>
              <Controller
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('projectId', null);
                    }}
                  >
                    <SelectTrigger className="w-full" aria-label="Client">
                      <SelectValue placeholder="Choose a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.clientId]} />
            </Field>
            <Field>
              <FieldLabel>Project (optional)</FieldLabel>
              <Controller
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <Select value={field.value ?? NO_PROJECT} onValueChange={chooseProject}>
                    <SelectTrigger className="w-full" aria-label="Project">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_PROJECT}>No project</SelectItem>
                      {clientProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field>
              <FieldLabel>Issue date</FieldLabel>
              <Controller
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <DateField label="Issue date" value={field.value} onChange={field.onChange} />
                )}
              />
            </Field>
            <Field data-invalid={Boolean(errors.dueDate)}>
              <FieldLabel>Due date</FieldLabel>
              <Controller
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <DateField label="Due date" value={field.value} onChange={field.onChange} />
                )}
              />
              <FieldError errors={[errors.dueDate]} />
            </Field>
          </div>
        </FieldGroup>

        <section className="space-y-3">
          <h2 className="ca-eyebrow text-muted-foreground">Line items</h2>
          <div className="text-muted-foreground hidden grid-cols-[minmax(0,1fr)_90px_110px_36px] gap-2 px-1 text-xs sm:grid">
            <span>Description</span>
            <span>Hours</span>
            <span>Rate (USD/h)</span>
          </div>
          {lines.fields.map((line, index) => (
            <div
              key={line.id}
              className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_90px_110px_36px]"
            >
              <Input
                className="col-span-2 sm:col-span-1"
                aria-label={`Line ${index + 1} description`}
                placeholder="Booking MVP: design, build and launch"
                aria-invalid={Boolean(errors.lines?.[index]?.description)}
                {...form.register(`lines.${index}.description`)}
              />
              <Input
                type="number"
                inputMode="decimal"
                step="0.25"
                min="0"
                aria-label={`Line ${index + 1} hours`}
                placeholder="Hours"
                className="font-figures"
                {...form.register(`lines.${index}.hours`, { valueAsNumber: true })}
              />
              <div className="flex gap-2 sm:contents">
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  aria-label={`Line ${index + 1} hourly rate`}
                  placeholder="Rate USD/h"
                  className="font-figures"
                  {...form.register(`lines.${index}.rate`, { valueAsNumber: true })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove line ${index + 1}`}
                  disabled={lines.fields.length === 1}
                  onClick={() => lines.remove(index)}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
          <FieldError errors={[errors.lines?.root ?? errors.lines]} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              lines.append({
                description: '',
                hours: 1,
                rate: Number(form.getValues(`lines.${lines.fields.length - 1}.rate`)) || 0,
              })
            }
          >
            <Plus />
            Add line
          </Button>
        </section>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="invoice-terms">Terms</FieldLabel>
            <Textarea id="invoice-terms" rows={3} {...form.register('terms')} />
          </Field>
          <Field>
            <FieldLabel htmlFor="invoice-notes">Note to the client (optional)</FieldLabel>
            <Textarea
              id="invoice-notes"
              rows={2}
              placeholder="Thanks for trusting us with the Booking MVP."
              {...form.register('notes')}
            />
          </Field>
        </FieldGroup>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="ca-glow bg-card space-y-4 rounded-2xl border p-5">
          <Field data-invalid={Boolean(errors.paymentProfileId)}>
            <FieldLabel>Pay to</FieldLabel>
            <Controller
              control={form.control}
              name="paymentProfileId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full" aria-label="Payment details">
                    <SelectValue placeholder="Add payment details first" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.isFavorite ? '★ ' : ''}
                        {profile.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.paymentProfileId]} />
          </Field>
          <div className="border-t pt-4">
            <p className="ca-eyebrow text-muted-foreground">Total due</p>
            <p className="font-figures text-primary mt-1 text-3xl font-semibold">
              {formatMoney(totalCents, INVOICE_CURRENCY)}
            </p>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            Create invoice
          </Button>
        </div>
      </aside>
    </form>
  );
}
