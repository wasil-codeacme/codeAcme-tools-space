import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToolId } from '@/config/tools';
import { Role, ToolAccessLevel } from '@/generated/prisma/enums';
import { SESSION_COOKIE } from '@/lib/constants';
import { signSession } from '@/lib/session';
import { getSessionUser } from '@/server/auth/session-context';
import { resetUserPassword, setToolAccess, setUserActive } from '@/server/services/user.service';
import { asActor, createTestUser } from '@/test/factories';

const cookieJar = new Map<string, string>();

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name);
      return value === undefined ? undefined : { name, value };
    },
  }),
}));

async function signInAs(user: { id: string; sessionVersion: number }) {
  cookieJar.set(SESSION_COOKIE, await signSession({ sub: user.id, ver: user.sessionVersion }));
}

describe('getSessionUser', () => {
  beforeEach(() => cookieJar.clear());

  it('returns the signed-in user', async () => {
    const member = await createTestUser();
    await signInAs(member);
    expect(await getSessionUser()).toMatchObject({ id: member.id, role: Role.MEMBER });
  });

  it('signs out a deactivated user immediately', async () => {
    const [admin, member] = await Promise.all([createTestUser(Role.ADMIN), createTestUser()]);
    await signInAs(member);
    await setUserActive(asActor(admin), { userId: member.id, isActive: false });
    expect(await getSessionUser()).toBeNull();
  });

  it('revokes old sessions when an admin resets the password', async () => {
    const [admin, member] = await Promise.all([createTestUser(Role.ADMIN), createTestUser()]);
    await signInAs(member);
    await resetUserPassword(asActor(admin), {
      userId: member.id,
      password: 'a-brand-new-password',
    });
    expect(await getSessionUser()).toBeNull();
  });

  it('ignores a forged cookie', async () => {
    cookieJar.set(SESSION_COOKIE, 'eyJzdWIiOiJ4In0.not-a-signature');
    expect(await getSessionUser()).toBeNull();
  });

  it('picks up tool access changes on the next request', async () => {
    const [admin, member] = await Promise.all([createTestUser(Role.ADMIN), createTestUser()]);
    await signInAs(member);
    expect((await getSessionUser())?.toolAccess).toEqual({});

    await setToolAccess(asActor(admin), {
      userId: member.id,
      toolId: ToolId.ACCOUNTS,
      level: ToolAccessLevel.VIEW,
    });
    expect((await getSessionUser())?.toolAccess).toEqual({
      [ToolId.ACCOUNTS]: ToolAccessLevel.VIEW,
    });
  });
});
