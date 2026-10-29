import 'server-only';
import { logger } from '@/lib/logger';
import { dollarsToCents } from '@/lib/projects/invoice-math';
import { hoursToMinutes } from '@/lib/time-tracking/duration';
import { NotFoundError, ProjectNameTakenError } from '@/server/errors';
import { assertClientAccess } from '@/server/policies/client-access.policy';
import { invoiceRepository } from '@/server/repositories/projects/invoice.repository';
import { paymentProfileRepository } from '@/server/repositories/projects/payment-profile.repository';
import { projectRepository } from '@/server/repositories/projects/project.repository';
import type { Actor } from '@/types/auth';
import type { InvoiceView, PaymentProfileView, ProjectView } from '@/types/projects';
import type {
  CreateInvoiceInput,
  PaymentProfileFieldsInput,
  ProjectFieldsInput,
  SetInvoiceStatusInput,
  UpdatePaymentProfileInput,
  UpdateProjectInput,
} from '@/server/validators/projects/projects.schema';

const INVOICE_CURRENCY = 'USD';

export function listProjects(): Promise<ProjectView[]> {
  return projectRepository.list();
}

export function listPaymentProfiles(): Promise<PaymentProfileView[]> {
  return paymentProfileRepository.list();
}

export function listInvoices(): Promise<InvoiceView[]> {
  return invoiceRepository.list();
}

export async function getInvoice(invoiceId: string): Promise<InvoiceView> {
  const invoice = await invoiceRepository.findById(invoiceId);
  if (!invoice) {
    throw new NotFoundError('Invoice');
  }
  return invoice;
}

function projectData({ actualHours, billedHours, ...fields }: ProjectFieldsInput) {
  return {
    ...fields,
    actualMinutes: actualHours === null ? null : hoursToMinutes(actualHours),
    billedMinutes: billedHours === null ? null : hoursToMinutes(billedHours),
  };
}

async function assertNameFree(clientId: string, name: string, projectId?: string) {
  const existing = await projectRepository.findByName(clientId, name);
  if (existing && existing.id !== projectId) {
    throw new ProjectNameTakenError();
  }
}

export async function createProject(actor: Actor, input: ProjectFieldsInput) {
  await assertClientAccess(actor, input.clientId, { allowArchived: true });
  await assertNameFree(input.clientId, input.name);
  const project = await projectRepository.create(projectData(input));
  logger.info({ projectId: project.id, actorId: actor.id }, 'Project created');
  return project;
}

export async function updateProject(actor: Actor, { projectId, ...input }: UpdateProjectInput) {
  if (!(await projectRepository.findById(projectId))) {
    throw new NotFoundError('Project');
  }
  await assertClientAccess(actor, input.clientId, { allowArchived: true });
  await assertNameFree(input.clientId, input.name, projectId);
  return projectRepository.update(projectId, projectData(input));
}

export function createPaymentProfile(input: PaymentProfileFieldsInput) {
  return paymentProfileRepository.create({ ...input, paymentLink: input.paymentLink ?? null });
}

export async function updatePaymentProfile({
  paymentProfileId,
  ...input
}: UpdatePaymentProfileInput) {
  if (!(await paymentProfileRepository.findById(paymentProfileId))) {
    throw new NotFoundError('Payment details');
  }
  return paymentProfileRepository.update(paymentProfileId, {
    ...input,
    paymentLink: input.paymentLink ?? null,
  });
}

export async function deletePaymentProfile(paymentProfileId: string) {
  if (!(await paymentProfileRepository.findById(paymentProfileId))) {
    throw new NotFoundError('Payment details');
  }
  await paymentProfileRepository.delete(paymentProfileId);
}

export async function createInvoice(actor: Actor, input: CreateInvoiceInput) {
  await assertClientAccess(actor, input.clientId, { allowArchived: true });
  const profile = await paymentProfileRepository.findById(input.paymentProfileId);
  if (!profile) {
    throw new NotFoundError('Payment details');
  }
  if (input.projectId) {
    const project = await projectRepository.findById(input.projectId);
    if (!project || project.clientId !== input.clientId) {
      throw new NotFoundError('Project');
    }
  }
  const invoice = await invoiceRepository.create({
    clientId: input.clientId,
    projectId: input.projectId,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    currency: INVOICE_CURRENCY,
    paymentDetails: profile.details,
    paymentLink: profile.paymentLink,
    terms: input.terms,
    notes: input.notes,
    lines: input.lines.map((line) => ({
      description: line.description,
      minutes: hoursToMinutes(line.hours),
      rateCents: dollarsToCents(line.rate),
    })),
  });
  logger.info(
    { invoiceId: invoice.id, number: invoice.number, actorId: actor.id },
    'Invoice created',
  );
  return invoice;
}

export async function setInvoiceStatus({ invoiceId, status }: SetInvoiceStatusInput) {
  await getInvoice(invoiceId);
  return invoiceRepository.setStatus(invoiceId, status);
}
