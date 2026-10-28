import { describe, expect, it } from 'vitest';
import { AccountAccessLevel, AccountAuditAction, Role } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { ForbiddenError, NotFoundError } from '@/server/errors';
import {
  createAccount,
  importAccounts,
  listAccounts,
  revealSecret,
  updateAccount,
} from '@/server/services/accounts/account.service';
import { RevealIntent, SecretField } from '@/types/accounts';
import { asActor, assignToClient, createTestClient, createTestUser } from '@/test/factories';

function fields(clientId: string | null, overrides: { secret?: string; name?: string } = {}) {
  return {
    clientId,
    name: overrides.name ?? 'Circle',
    purpose: 'Community',
    accessLevel: AccountAccessLevel.MASTER,
    url: 'https://example.circle.so',
    username: 'owner@example.com',
    twoFactor: null,
    notes: null,
    secret: overrides.secret,
    secureNotes: undefined,
  };
}

describe('account secrets', () => {
  it('stores secrets encrypted and never lists them', async () => {
    const admin = await createTestUser(Role.ADMIN);
    const client = await createTestClient();
    const account = await createAccount(
      asActor(admin),
      fields(client.id, { secret: 'hunter22-secret' }),
    );

    const stored = await prisma.account.findUniqueOrThrow({ where: { id: account.id } });
    expect(stored.secretCiphertext).not.toContain('hunter22-secret');
    const [listed] = await listAccounts(asActor(admin));
    expect(listed).toMatchObject({ hasSecret: true });
    expect(JSON.stringify(listed)).not.toContain('hunter22-secret');
  });

  it('reveals a secret and records who did it', async () => {
    const admin = await createTestUser(Role.ADMIN);
    const client = await createTestClient();
    const account = await createAccount(
      asActor(admin),
      fields(client.id, { secret: 'hunter22-secret' }),
    );

    const revealed = await revealSecret(asActor(admin), {
      accountId: account.id,
      field: SecretField.SECRET,
      intent: RevealIntent.COPY,
    });

    expect(revealed.value).toBe('hunter22-secret');
    const actions = await prisma.accountAuditEvent.findMany({ where: { accountId: account.id } });
    expect(actions.map((event) => event.action)).toEqual([
      AccountAuditAction.CREATED,
      AccountAuditAction.COPIED,
    ]);
  });

  it('keeps the stored secret when an edit leaves the password blank', async () => {
    const admin = await createTestUser(Role.ADMIN);
    const client = await createTestClient();
    const account = await createAccount(
      asActor(admin),
      fields(client.id, { secret: 'keep-me-please' }),
    );

    await updateAccount(asActor(admin), {
      ...fields(client.id, { name: 'Circle (renamed)' }),
      accountId: account.id,
    });
    const revealed = await revealSecret(asActor(admin), {
      accountId: account.id,
      field: SecretField.SECRET,
      intent: RevealIntent.REVEAL,
    });
    expect(revealed.value).toBe('keep-me-please');
  });
});

describe('account access', () => {
  it('shows members only accounts of clients they are assigned to, never internal ones', async () => {
    const [admin, member] = await Promise.all([createTestUser(Role.ADMIN), createTestUser()]);
    const [assigned, other] = await Promise.all([createTestClient(), createTestClient()]);
    await assignToClient(assigned.id, member.id);
    await createAccount(asActor(admin), fields(assigned.id, { name: 'Visible' }));
    await createAccount(asActor(admin), fields(other.id, { name: 'Other client' }));
    const internal = await createAccount(
      asActor(admin),
      fields(null, { name: 'Internal', secret: 'x-internal' }),
    );

    expect((await listAccounts(asActor(member))).map((account) => account.name)).toEqual([
      'Visible',
    ]);
    await expect(
      revealSecret(asActor(member), {
        accountId: internal.id,
        field: SecretField.SECRET,
        intent: RevealIntent.REVEAL,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('stops members from creating internal accounts or importing into unassigned clients', async () => {
    const member = await createTestUser();
    const client = await createTestClient();

    await expect(createAccount(asActor(member), fields(null))).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(
      importAccounts(asActor(member), {
        clientId: client.id,
        rows: [
          {
            name: 'Zoom',
            purpose: null,
            url: null,
            username: null,
            accessLevel: null,
            twoFactor: null,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(await prisma.account.count()).toBe(0);
  });
});
