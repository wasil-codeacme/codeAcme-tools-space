import { describe, expect, it } from 'vitest';
import { Role } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { UsageStatus } from '@/lib/time-tracking/usage';
import { ForbiddenError, InvalidCategoryError, NotFoundError } from '@/server/errors';
import {
  deleteEntry,
  getLogView,
  importEntries,
  logEntry,
  updateEntry,
} from '@/server/services/time-tracking/time-entry.service';
import {
  asActor,
  assignToClient,
  createTestCategory,
  createTestClient,
  createTestEntry,
  createTestUser,
} from '@/test/factories';

function entryFields(
  clientId: string,
  overrides: Partial<{ categoryId: string | null; durationMinutes: number }> = {},
) {
  return {
    clientId,
    dateKey: '2026-10-21',
    durationMinutes: 30,
    task: 'Event sheet set up',
    categoryId: null,
    requestedBy: null,
    link: null,
    needsReview: false,
    ...overrides,
  };
}

describe('time entry access rules', () => {
  it('stops members from logging time to clients they are not assigned to', async () => {
    const member = await createTestUser();
    const client = await createTestClient();

    await expect(logEntry(asActor(member), entryFields(client.id))).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(await prisma.timeEntry.count()).toBe(0);
  });

  it('lets assigned members log time and shows them only their own entries', async () => {
    const [member, colleague] = await Promise.all([createTestUser(), createTestUser()]);
    const client = await createTestClient();
    await Promise.all([
      assignToClient(client.id, member.id),
      assignToClient(client.id, colleague.id),
    ]);
    await createTestEntry(client.id, colleague.id);

    await logEntry(asActor(member), entryFields(client.id));
    const view = await getLogView(asActor(member), { clientId: client.id, dateKey: '2026-10-21' });

    expect(view.entries.map((entry) => entry.userId)).toEqual([member.id]);
    expect(view.monthUsage.usedMinutes).toBe(60);
  });

  it('lets admins see every member, or narrow to one', async () => {
    const [admin, member] = await Promise.all([createTestUser(Role.ADMIN), createTestUser()]);
    const client = await createTestClient();
    await createTestEntry(client.id, member.id);
    await createTestEntry(client.id, admin.id);

    const everyone = await getLogView(asActor(admin), {
      clientId: client.id,
      dateKey: '2026-10-21',
    });
    const narrowed = await getLogView(asActor(admin), {
      clientId: client.id,
      dateKey: '2026-10-21',
      memberId: member.id,
    });

    expect(everyone.entries).toHaveLength(2);
    expect(narrowed.entries.map((entry) => entry.userId)).toEqual([member.id]);
  });

  it("forbids members from changing someone else's entry but allows admins", async () => {
    const [admin, author, other] = await Promise.all([
      createTestUser(Role.ADMIN),
      createTestUser(),
      createTestUser(),
    ]);
    const client = await createTestClient();
    await Promise.all([assignToClient(client.id, author.id), assignToClient(client.id, other.id)]);
    const entry = await createTestEntry(client.id, author.id);

    await expect(
      updateEntry(asActor(other), { ...entryFields(client.id), entryId: entry.id }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(deleteEntry(asActor(other), { entryId: entry.id })).rejects.toBeInstanceOf(
      ForbiddenError,
    );

    const updated = await updateEntry(asActor(admin), {
      ...entryFields(client.id, { durationMinutes: 45 }),
      entryId: entry.id,
    });
    expect(updated.entry.durationMinutes).toBe(45);
  });

  it('rejects archived categories and categories from another client', async () => {
    const admin = await createTestUser(Role.ADMIN);
    const [client, otherClient] = await Promise.all([createTestClient(), createTestClient()]);
    const archived = await createTestCategory(client.id, { isArchived: true });
    const foreign = await createTestCategory(otherClient.id);

    await expect(
      logEntry(asActor(admin), entryFields(client.id, { categoryId: archived.id })),
    ).rejects.toBeInstanceOf(InvalidCategoryError);
    await expect(
      logEntry(asActor(admin), entryFields(client.id, { categoryId: foreign.id })),
    ).rejects.toBeInstanceOf(InvalidCategoryError);
  });

  it('keeps an archived category on entries that already had it', async () => {
    const admin = await createTestUser(Role.ADMIN);
    const client = await createTestClient();
    const category = await createTestCategory(client.id);
    const entry = await createTestEntry(client.id, admin.id, { categoryId: category.id });
    await prisma.timeCategory.update({ where: { id: category.id }, data: { isArchived: true } });

    const updated = await updateEntry(asActor(admin), {
      ...entryFields(client.id, { categoryId: category.id }),
      entryId: entry.id,
    });
    expect(updated.entry.categoryId).toBe(category.id);
  });

  it('reports the monthly limit as reached once logged time hits the cap', async () => {
    const admin = await createTestUser(Role.ADMIN);
    const client = await createTestClient({ monthlyLimitMinutes: 60 });
    await createTestEntry(client.id, admin.id, { durationMinutes: 40 });

    const result = await logEntry(asActor(admin), entryFields(client.id, { durationMinutes: 20 }));
    expect(result.usage.status).toBe(UsageStatus.LIMIT_REACHED);
  });
});

describe('importEntries', () => {
  it('saves every pasted item for the importing member', async () => {
    const member = await createTestUser();
    const client = await createTestClient();
    await assignToClient(client.id, member.id);

    const result = await importEntries(asActor(member), {
      clientId: client.id,
      categoryId: null,
      entries: [
        { dateKey: '2026-10-21', durationMinutes: 30, task: 'meet', needsReview: false },
        { dateKey: '2026-10-27', durationMinutes: 15, task: 'Bitwarden', needsReview: true },
      ],
    });

    expect(result.count).toBe(2);
    expect(await prisma.timeEntry.count({ where: { userId: member.id, needsReview: true } })).toBe(
      1,
    );
  });

  it('imports nothing when the chosen category is invalid', async () => {
    const admin = await createTestUser(Role.ADMIN);
    const [client, otherClient] = await Promise.all([createTestClient(), createTestClient()]);
    const foreign = await createTestCategory(otherClient.id);

    await expect(
      importEntries(asActor(admin), {
        clientId: client.id,
        categoryId: foreign.id,
        entries: [{ dateKey: '2026-10-21', durationMinutes: 30, task: 'meet', needsReview: false }],
      }),
    ).rejects.toBeInstanceOf(InvalidCategoryError);
    expect(await prisma.timeEntry.count()).toBe(0);
  });
});
