import { describe, expect, it } from 'vitest';
import { Role } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { ForbiddenError, TimerError } from '@/server/errors';
import {
  deleteSession,
  listHistory,
  logSessionToTimeTracking,
  startSession,
  stopSession,
  updateSession,
} from '@/server/services/work-timer/work-session.service';
import { asActor, assignToClient, createTestClient, createTestUser } from '@/test/factories';

const NINE = new Date('2026-10-28T09:00:00Z');
const TEN_TEN = new Date('2026-10-28T10:10:00Z');

describe('work timer', () => {
  it('starts, refuses a second running timer, and stops with the worked minutes', async () => {
    const member = await createTestUser();
    await startSession(asActor(member), { clientId: null, note: 'Kajabi setup' }, NINE);

    await expect(
      startSession(asActor(member), { clientId: null, note: null }, NINE),
    ).rejects.toBeInstanceOf(TimerError);
    const stopped = await stopSession(asActor(member), TEN_TEN);

    expect(stopped.durationMinutes).toBe(70);
    expect(await listHistory(asActor(member), { now: TEN_TEN })).toHaveLength(1);
  });

  it('keeps each person to their own history, while admins can see everyone', async () => {
    const [admin, member, other] = await Promise.all([
      createTestUser(Role.ADMIN),
      createTestUser(),
      createTestUser(),
    ]);
    for (const person of [member, other]) {
      await startSession(asActor(person), { clientId: null, note: null }, NINE);
      await stopSession(asActor(person), TEN_TEN);
    }

    expect(
      (await listHistory(asActor(member), { memberId: other.id, now: TEN_TEN })).map(
        (session) => session.userId,
      ),
    ).toEqual([member.id]);
    expect(await listHistory(asActor(admin), { memberId: null, now: TEN_TEN })).toHaveLength(2);
  });

  it("stops members from editing or deleting someone else's session", async () => {
    const [member, other] = await Promise.all([createTestUser(), createTestUser()]);
    const session = await startSession(asActor(other), { clientId: null, note: null }, NINE);
    await stopSession(asActor(other), TEN_TEN);

    await expect(deleteSession(asActor(member), { sessionId: session.id })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(
      updateSession(
        asActor(member),
        {
          sessionId: session.id,
          clientId: null,
          note: null,
          startedAt: NINE.toISOString(),
          endedAt: TEN_TEN.toISOString(),
        },
        TEN_TEN,
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('rejects an edited end time before the start', async () => {
    const member = await createTestUser();
    const session = await startSession(asActor(member), { clientId: null, note: null }, NINE);
    await stopSession(asActor(member), TEN_TEN);

    await expect(
      updateSession(
        asActor(member),
        {
          sessionId: session.id,
          clientId: null,
          note: null,
          startedAt: TEN_TEN.toISOString(),
          endedAt: NINE.toISOString(),
        },
        TEN_TEN,
      ),
    ).rejects.toBeInstanceOf(TimerError);
  });

  it('adds a finished session to the time log once, on the local day', async () => {
    const member = await createTestUser();
    const client = await createTestClient();
    await assignToClient(client.id, member.id);
    const session = await startSession(
      asActor(member),
      { clientId: client.id, note: 'Zoom glitch' },
      NINE,
    );
    await stopSession(asActor(member), TEN_TEN);

    await logSessionToTimeTracking(asActor(member), { sessionId: session.id }, 'Asia/Karachi');
    const entry = await prisma.timeEntry.findFirstOrThrow({ where: { userId: member.id } });

    expect(entry).toMatchObject({ durationMinutes: 70, task: 'Zoom glitch', clientId: client.id });
    await expect(
      logSessionToTimeTracking(asActor(member), { sessionId: session.id }, 'Asia/Karachi'),
    ).rejects.toBeInstanceOf(TimerError);
  });
});
