'use client';

import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ProjectStatus } from '@/generated/prisma/enums';
import { reportActionError } from '@/lib/action-feedback';
import { MESSAGES } from '@/lib/messages';
import { PROJECT_STATUS_LABELS } from '@/lib/projects/labels';
import { minutesToHours } from '@/lib/time-tracking/duration';
import { createProject, updateProject } from '@/server/actions/projects/projects.actions';
import {
  type ProjectFieldsForm,
  projectFieldsSchema,
} from '@/server/validators/projects/projects.schema';
import type { ProjectView } from '@/types/projects';

// Also runs on the default value, which is a number or null rather than input text.
function hoursOrBlank(value: string | number | null): number | null {
  const text = String(value ?? '').trim();
  return text === '' ? null : Number(text);
}

function defaults(project: ProjectView | null, clientId: string): ProjectFieldsForm {
  return {
    clientId: project?.clientId ?? clientId,
    name: project?.name ?? '',
    description: project?.description ?? '',
    status: project?.status ?? ProjectStatus.ACTIVE,
    actualHours: project?.actualMinutes == null ? null : minutesToHours(project.actualMinutes),
    billedHours: project?.billedMinutes == null ? null : minutesToHours(project.billedMinutes),
  };
}

interface ProjectDialogProps {
  clients: { id: string; name: string }[];
  project?: ProjectView;
  trigger?: React.ReactNode;
}

export function ProjectDialog({ clients, project, trigger }: ProjectDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useForm<ProjectFieldsForm>({
    resolver: zodResolver(projectFieldsSchema),
    defaultValues: defaults(project ?? null, clients[0]?.id ?? ''),
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = project
        ? await updateProject({ ...values, projectId: project.id })
        : await createProject(values);
      if (result.error !== undefined) {
        reportActionError(result.error, form.setError);
        return;
      }
      toast.success(project ? MESSAGES.PROJECT.UPDATE_SUCCESS : MESSAGES.PROJECT.CREATE_SUCCESS);
      setIsOpen(false);
      if (!project) {
        form.reset(defaults(null, values.clientId));
      }
    });
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus />
            New project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{project ? `Edit ${project.name}` : 'New project'}</DialogTitle>
          <DialogDescription>
            Work outside the monthly hours, like an MVP. Record what it really took and what the
            client is billed.
          </DialogDescription>
        </DialogHeader>
        <form id="project-form" onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.clientId)}>
                <FieldLabel>Client</FieldLabel>
                <Controller
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
                <FieldLabel>Status</FieldLabel>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full" aria-label="Status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ProjectStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {PROJECT_STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor="project-name">Name</FieldLabel>
              <Input id="project-name" placeholder="Booking MVP" {...form.register('name')} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="project-description">What was built</FieldLabel>
              <Textarea
                id="project-description"
                rows={3}
                placeholder="Online booking flow with live availability and email confirmations."
                {...form.register('description')}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.actualHours)}>
                <FieldLabel htmlFor="project-actual">Hours it took</FieldLabel>
                <Input
                  id="project-actual"
                  type="number"
                  inputMode="decimal"
                  step="0.25"
                  min="0"
                  placeholder="6"
                  {...form.register('actualHours', { setValueAs: hoursOrBlank })}
                />
                <FieldDescription>Internal only.</FieldDescription>
                <FieldError errors={[errors.actualHours]} />
              </Field>
              <Field data-invalid={Boolean(errors.billedHours)}>
                <FieldLabel htmlFor="project-billed">Hours billed</FieldLabel>
                <Input
                  id="project-billed"
                  type="number"
                  inputMode="decimal"
                  step="0.25"
                  min="0"
                  placeholder="20"
                  {...form.register('billedHours', { setValueAs: hoursOrBlank })}
                />
                <FieldDescription>What the client sees.</FieldDescription>
                <FieldError errors={[errors.billedHours]} />
              </Field>
            </div>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="project-form" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {project ? 'Save' : 'Add project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
