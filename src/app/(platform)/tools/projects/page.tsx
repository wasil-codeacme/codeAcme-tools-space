import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { BriefcaseBusiness, FileText, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/platform/page-header';
import { ListPageSkeleton } from '@/components/platform/skeletons';
import { ProjectDialog } from '@/components/tools/projects/project-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { ToolId, canUseTool } from '@/config/tools';
import { ProjectStatus, Role, ToolAccessLevel } from '@/generated/prisma/enums';
import { PROJECT_STATUS_LABELS } from '@/lib/projects/labels';
import { ROUTES } from '@/lib/routes';
import { formatDuration } from '@/lib/time-tracking/duration';
import { requireToolAccess } from '@/server/auth/guards';
import { listAccessibleClients } from '@/server/policies/client-access.policy';
import { listProjects } from '@/server/services/projects/projects.service';
import type { ProjectView } from '@/types/projects';

export const metadata: Metadata = { title: 'Projects' };

function HoursFigure({ label, minutes }: { label: string; minutes: number | null }) {
  return (
    <div>
      <p className="ca-eyebrow text-muted-foreground text-[0.62rem]">{label}</p>
      <p className="font-figures mt-0.5 text-lg font-medium">
        {minutes === null ? '—' : formatDuration(minutes)}
      </p>
    </div>
  );
}

function ProjectCard({
  project,
  clients,
  index,
  canEdit,
  canInvoice,
}: {
  project: ProjectView;
  clients: { id: string; name: string }[];
  index: number;
  canEdit: boolean;
  canInvoice: boolean;
}) {
  return (
    <li
      style={{ '--i': index } as CSSProperties}
      className="ca-reveal bg-card flex flex-col gap-4 rounded-2xl border p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs">{project.clientName}</p>
          <h2 className="truncate text-lg font-semibold tracking-tight">{project.name}</h2>
        </div>
        <Badge variant={project.status === ProjectStatus.ACTIVE ? 'default' : 'secondary'}>
          {PROJECT_STATUS_LABELS[project.status]}
        </Badge>
      </div>
      {project.description && (
        <p className="text-muted-foreground line-clamp-2 text-sm">{project.description}</p>
      )}
      <div className="grid grid-cols-2 gap-3 rounded-xl border p-3">
        <HoursFigure label="It took" minutes={project.actualMinutes} />
        <HoursFigure label="Billed" minutes={project.billedMinutes} />
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs">
          {project.invoiceCount === 0
            ? 'Not invoiced yet'
            : `${project.invoiceCount} invoice${project.invoiceCount === 1 ? '' : 's'}`}
        </span>
        {canEdit && (
          <div className="flex gap-2">
            <ProjectDialog
              clients={clients}
              project={project}
              trigger={
                <Button variant="ghost" size="sm">
                  <Pencil />
                  Edit
                </Button>
              }
            />
            {canInvoice && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`${ROUTES.TOOLS.PROJECTS.NEW_INVOICE}?projectId=${project.id}`}>
                  <FileText />
                  Invoice it
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

async function ProjectsContent() {
  const actor = await requireToolAccess(ToolId.PROJECTS);
  const [projects, clients] = await Promise.all([
    listProjects(actor),
    listAccessibleClients(actor, { includeArchived: true }),
  ]);
  const clientOptions = clients.map(({ id, name }) => ({ id, name }));
  const canEdit = canUseTool(actor, ToolId.PROJECTS, ToolAccessLevel.EDIT);
  const canInvoice = actor.role === Role.ADMIN;

  return (
    <>
      <PageHeader
        title="Projects"
        description="One-off work like an MVP: what it really took, what the client is billed, and its invoices."
        actions={canEdit ? <ProjectDialog clients={clientOptions} /> : undefined}
      />
      {projects.length === 0 ? (
        <Empty className="bg-card/60 rounded-2xl border border-dashed py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BriefcaseBusiness />
            </EmptyMedia>
            <EmptyTitle>No projects yet</EmptyTitle>
            <EmptyDescription>
              Add a project such as &ldquo;Booking MVP&rdquo; to record its hours and invoice it.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              clients={clientOptions}
              index={index}
              canEdit={canEdit}
              canInvoice={canInvoice}
            />
          ))}
        </ul>
      )}
    </>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <ProjectsContent />
    </Suspense>
  );
}
