import { describe, expect, it } from 'vitest';
import { Role } from '@/generated/prisma/enums';
import { EmailTakenError, LastAdminError, SelfActionError } from '@/server/errors';
import { createUser, setUserActive, updateUser } from '@/server/services/user.service';
import { asActor, createTestUser } from '@/test/factories';

describe('team management guards', () => {
  it('refuses to demote or deactivate the last active admin', async () => {
    const [admin, otherAdmin] = await Promise.all([
      createTestUser(Role.ADMIN),
      createTestUser(Role.ADMIN),
    ]);
    await setUserActive(asActor(admin), { userId: otherAdmin.id, isActive: false });

    await expect(
      updateUser(asActor(otherAdmin), { userId: admin.id, name: admin.name, role: Role.MEMBER }),
    ).rejects.toBeInstanceOf(LastAdminError);
  });

  it('stops admins from deactivating or demoting themselves', async () => {
    const [admin] = await Promise.all([createTestUser(Role.ADMIN), createTestUser(Role.ADMIN)]);

    await expect(
      setUserActive(asActor(admin), { userId: admin.id, isActive: false }),
    ).rejects.toBeInstanceOf(SelfActionError);
    await expect(
      updateUser(asActor(admin), { userId: admin.id, name: admin.name, role: Role.MEMBER }),
    ).rejects.toBeInstanceOf(SelfActionError);
  });

  it('rejects a second account with the same email', async () => {
    const existing = await createTestUser();
    await expect(
      createUser({
        name: 'Copy',
        email: existing.email,
        role: Role.MEMBER,
        password: 'another-long-password',
      }),
    ).rejects.toBeInstanceOf(EmailTakenError);
  });
});
