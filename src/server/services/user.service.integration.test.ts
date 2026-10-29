import { describe, expect, it } from 'vitest';
import { Role } from '@/generated/prisma/enums';
import { EmailTakenError, LastAdminError, SelfActionError } from '@/server/errors';
import { createUser, setUserActive, updateUser } from '@/server/services/user.service';
import { asActor, createTestUser } from '@/test/factories';
import { createFailingMailer, createRecordingMailer } from '@/test/fake-mailer';

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
      createUser(createRecordingMailer(), {
        name: 'Copy',
        email: existing.email,
        role: Role.MEMBER,
        password: 'another-long-password',
      }),
    ).rejects.toBeInstanceOf(EmailTakenError);
  });

  it('emails a new member their sign-in details', async () => {
    const mailer = createRecordingMailer();
    await createUser(mailer, {
      name: 'Asfand Yar',
      email: 'asfand@example.com',
      role: Role.MEMBER,
      password: 'temporary-password-123',
    });
    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0]?.to).toBe('asfand@example.com');
    expect(mailer.sent[0]?.text).toContain('temporary-password-123');
  });

  it('still creates the member when the welcome email cannot be sent', async () => {
    const user = await createUser(createFailingMailer(), {
      name: 'Offline Mail',
      email: 'offline@example.com',
      role: Role.MEMBER,
      password: 'temporary-password-123',
    });
    expect(user.email).toBe('offline@example.com');
  });
});
