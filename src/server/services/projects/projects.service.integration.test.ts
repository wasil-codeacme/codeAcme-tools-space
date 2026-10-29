import { describe, expect, it } from 'vitest';
import { Role } from '@/generated/prisma/enums';
import { NotFoundError, ProjectNameTakenError } from '@/server/errors';
import {
  createInvoice,
  createPaymentProfile,
  createProject,
  getInvoice,
  listInvoices,
  listProjects,
  updatePaymentProfile,
} from '@/server/services/projects/projects.service';
import { projectFieldsSchema } from '@/server/validators/projects/projects.schema';
import { asActor, assignToClient, createTestClient, createTestUser } from '@/test/factories';

async function setUp() {
  const [admin, client] = await Promise.all([createTestUser(Role.ADMIN), createTestClient()]);
  const profile = await createPaymentProfile({
    label: 'Wise USD',
    details: 'Account holder: CodeAcme LLC',
    paymentLink: 'https://wise.com/pay/codeacme',
    isFavorite: true,
  });
  return { actor: asActor(admin), client, profile };
}

function invoiceFor(clientId: string, paymentProfileId: string, projectId: string | null = null) {
  return {
    clientId,
    projectId,
    issueDate: '2026-10-29',
    dueDate: '2026-11-12',
    paymentProfileId,
    terms: null,
    notes: null,
    lines: [{ description: 'Booking MVP', hours: 20, rate: 45 }],
  };
}

describe('projects and invoices', () => {
  it('records actual and billed hours separately', async () => {
    const { actor, client } = await setUp();
    // Parsed the way the form and the action both parse it, so hours convert exactly once.
    const fields = projectFieldsSchema.parse(
      projectFieldsSchema.parse({
        clientId: client.id,
        name: 'Booking MVP',
        actualHours: 6,
        billedHours: 20,
      }),
    );
    const project = await createProject(actor, fields);
    expect(project).toMatchObject({ actualMinutes: 360, billedMinutes: 1200 });
    await expect(
      createProject(actor, {
        clientId: client.id,
        name: 'Booking MVP',
        description: null,
        status: 'ACTIVE',
        actualHours: null,
        billedHours: null,
      }),
    ).rejects.toBeInstanceOf(ProjectNameTakenError);
  });

  it('numbers invoices sequentially per year, even when created at the same moment', async () => {
    const { actor, client, profile } = await setUp();
    const invoices = await Promise.all(
      Array.from({ length: 5 }, () => createInvoice(actor, invoiceFor(client.id, profile.id))),
    );
    expect(invoices.map((invoice) => invoice.number).sort()).toEqual([
      'INV-2026-001',
      'INV-2026-002',
      'INV-2026-003',
      'INV-2026-004',
      'INV-2026-005',
    ]);
  });

  it('totals hours times rate and keeps its own copy of the payment details', async () => {
    const { actor, client, profile } = await setUp();
    const created = await createInvoice(actor, invoiceFor(client.id, profile.id));
    await updatePaymentProfile({
      paymentProfileId: profile.id,
      label: 'Wise USD',
      details: 'Changed later',
      paymentLink: null,
      isFavorite: true,
    });

    const invoice = await getInvoice(actor, created.id);
    expect(invoice.totalCents).toBe(90_000);
    expect(invoice.paymentDetails).toBe('Account holder: CodeAcme LLC');
    expect(invoice.paymentLink).toBe('https://wise.com/pay/codeacme');
  });

  it('refuses a project that belongs to another client', async () => {
    const { actor, client, profile } = await setUp();
    const otherClient = await createTestClient();
    const project = await createProject(actor, {
      clientId: otherClient.id,
      name: 'Other work',
      description: null,
      status: 'ACTIVE',
      actualHours: null,
      billedHours: 10,
    });
    await expect(
      createInvoice(actor, invoiceFor(client.id, profile.id, project.id)),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("shows members only their own clients' projects and invoices", async () => {
    const { actor, client, profile } = await setUp();
    const [member, otherClient] = await Promise.all([createTestUser(), createTestClient()]);
    await assignToClient(client.id, member.id);
    const project = {
      description: null,
      status: 'ACTIVE' as const,
      actualHours: null,
      billedHours: 5,
    };
    await createProject(actor, { ...project, clientId: client.id, name: 'Theirs' });
    await createProject(actor, { ...project, clientId: otherClient.id, name: 'Not theirs' });
    await createInvoice(actor, invoiceFor(client.id, profile.id));
    const hidden = await createInvoice(actor, invoiceFor(otherClient.id, profile.id));

    const memberActor = asActor(member);
    expect((await listProjects(memberActor)).map((item) => item.name)).toEqual(['Theirs']);
    expect((await listInvoices(memberActor)).map((item) => item.clientId)).toEqual([client.id]);
    await expect(getInvoice(memberActor, hidden.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});
