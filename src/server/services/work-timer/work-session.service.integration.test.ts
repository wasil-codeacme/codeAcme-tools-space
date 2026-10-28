import { describe, expect, it } from 'vitest';
import { Role } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { ForbiddenError, NotFoundError, TimerError } from '@/server/errors';
import {
  deleteSession,
  listHistory,
  logSessionToTimeTracking,
  recordSession,
  updateSession,
} from '@/server/services/work-timer/work-session.service';
import { asActor, assignToClient, createTestClient, createTestUser } from '@/test/factories';

const NINE = '2026-10-28T09:00:00.000Z';
const TEN_TEN = '2026-10-28T10:10:00.000Z';
const NOW = new Date(TEN_TEN);
const SEVENTY_MINUTES = 70 * 60;

function finished(overrides: Partial<Parameters<typeof recordSession>[1]> = {}) {
  return {
    legacySessionId: null,
    clientId: null,
    note: 'Kajabi setup',
    startedAt: NINE,
    endedAt: TEN_TEN,
    workedSeconds: SEVENTY_MINUTES,
    ...overrides,
  };
}

describe('recording browser-timed sessions', () => {
  it('saves the worked time, excluding pauses, and shows it in history', async () => {
    const member = await createTestUser();
    await recordSession(asActor(member), finished({ workedSeconds: 40 * 60 }));

    const [session] = await listHistory(asActor(member), { now: NOW });
    expect(session).toMatchObject({ workedSeconds: 40 * 60, startedAt: NINE, endedAt: TEN_TEN });
  });

  it('rejects worked time longer than the start-to-stop range, or a stop before the start', async () => {
    const member = await createTestUser();
    await expect(
      recordSession(asActor(member), finished({ workedSeconds: SEVENTY_MINUTES + 120 })),
    ).rejects.toBeInstanceOf(TimerError);
    await expect(
      recordSession(asActor(member), finished({ startedAt: TEN_TEN, endedAt: NINE })),
    ).rejects.toBeInstanceOf(TimerError);
  });

  it('finishes a timer that the previous version started on the server', async () => {
    const member = await createTestUser();
    const legacy = await prisma.workSession.create({
      data: { userId: member.id, startedAt: new Date(NINE) },
    });

    await recordSession(asActor(member), finished({ legacySessionId: legacy.id }));

    expect(await prisma.workSession.count()).toBe(1);
    expect(await prisma.workSession.findUniqueOrThrow({ where: { id: legacy.id } })).toMatchObject({
      workedSeconds: SEVENTY_MINUTES,
      endedAt: new Date(TEN_TEN),
    });
  });

  it("refuses to finish someone else's legacy timer", async () => {
    const [member, other] = await Promise.all([createTestUser(), createTestUser()]);
    const legacy = await prisma.workSession.create({
      data: { userId: other.id, startedAt: new Date(NINE) },
    });
    await expect(
      recordSession(asActor(member), finished({ legacySessionId: legacy.id })),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('keeps each person to their own history, while admins can see everyone', async () => {
    const [admin, member, other] = await Promise.all([
      createTestUser(Role.ADMIN),
      createTestUser(),
      createTestUser(),
    ]);
    await recordSession(asActor(member), finished());
    await recordSession(asActor(other), finished());

    const memberView = await listHistory(asActor(member), { memberId: other.id, now: NOW });
    expect(memberView.map((session) => session.userId)).toEqual([member.id]);
    expect(await listHistory(asActor(admin), { memberId: null, now: NOW })).toHaveLength(2);
  });

  it("stops members from editing or deleting someone else's session", async () => {
    const [member, other] = await Promise.all([createTestUser(), createTestUser()]);
    const session = await recordSession(asActor(other), finished());

    await expect(deleteSession(asActor(member), { sessionId: session.id })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(
      updateSession(
        asActor(member),
        { sessionId: session.id, clientId: null, note: null, startedAt: NINE, endedAt: TEN_TEN },
        NOW,
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('logs the pause-aware worked time to the time log once, on the local day', async () => {
    const member = await createTestUser();
    const client = await createTestClient();
    await assignToClient(client.id, member.id);
    const session = await recordSession(
      asActor(member),
      finished({ clientId: client.id, note: 'Zoom glitch', workedSeconds: 45 * 60 }),
    );

    await logSessionToTimeTracking(asActor(member), { sessionId: session.id }, 'Asia/Karachi');
    const entry = await prisma.timeEntry.findFirstOrThrow({ where: { userId: member.id } });

    expect(entry).toMatchObject({ durationMinutes: 45, task: 'Zoom glitch', clientId: client.id });
    await expect(
      logSessionToTimeTracking(asActor(member), { sessionId: session.id }, 'Asia/Karachi'),
    ).rejects.toBeInstanceOf(TimerError);
  });
});
