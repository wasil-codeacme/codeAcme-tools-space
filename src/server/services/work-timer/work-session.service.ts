import 'server-only';
import { WORK_TIMER_HISTORY_DAYS } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { MESSAGES } from '@/lib/messages';
import { todayKey } from '@/lib/time-tracking/date-key';
import { billableSessionMinutes, sessionMinutes } from '@/lib/work-timer/session-history';
import { NotFoundError, TimerError } from '@/server/errors';
import {
  assertCanModifyEntry,
  assertClientAccess,
  isAdmin,
} from '@/server/policies/client-access.policy';
import { timeEntryRepository } from '@/server/repositories/time-tracking/time-entry.repository';
import { workSessionRepository } from '@/server/repositories/work-timer/work-session.repository';
import type { Actor } from '@/types/auth';
import type { WorkSessionView } from '@/types/work-timer';
import type {
  SessionIdInput,
  StartSessionInput,
  UpdateSessionInput,
} from '@/server/validators/work-timer/work-session.schema';

const MILLISECONDS_PER_DAY = 86_400_000;
const DEFAULT_SESSION_TASK = 'Timed work session';

async function assertOptionalClient(actor: Actor, clientId: string | null): Promise<void> {
  if (clientId !== null) {
    await assertClientAccess(actor, clientId);
  }
}

async function loadModifiable(actor: Actor, sessionId: string) {
  const session = await workSessionRepository.findById(sessionId);
  if (!session) {
    throw new NotFoundError('Work session');
  }
  assertCanModifyEntry(actor, session.userId);
  return session;
}

export function getRunningSession(actor: Actor): Promise<WorkSessionView | null> {
  return workSessionRepository.findRunning(actor.id);
}

// Members only see their own history; admins can look at one person or everyone.
export function listHistory(
  actor: Actor,
  { memberId, now }: { memberId?: string | null; now: Date },
): Promise<WorkSessionView[]> {
  const since = new Date(now.getTime() - WORK_TIMER_HISTORY_DAYS * MILLISECONDS_PER_DAY);
  const userId = isAdmin(actor)
    ? memberId === null
      ? undefined
      : (memberId ?? actor.id)
    : actor.id;
  return workSessionRepository.listFinished(userId, since);
}

export async function startSession(actor: Actor, { clientId, note }: StartSessionInput, now: Date) {
  if (await workSessionRepository.findRunning(actor.id)) {
    throw new TimerError(MESSAGES.TIMER.ALREADY_RUNNING);
  }
  await assertOptionalClient(actor, clientId);
  const session = await workSessionRepository.create({
    userId: actor.id,
    clientId,
    note,
    startedAt: now,
  });
  logger.info({ sessionId: session.id, userId: actor.id }, 'Work timer started');
  return session;
}

export async function stopSession(actor: Actor, now: Date) {
  const running = await workSessionRepository.findRunning(actor.id);
  if (!running) {
    throw new TimerError(MESSAGES.TIMER.NOT_RUNNING);
  }
  const session = await workSessionRepository.update(running.id, { endedAt: now });
  logger.info({ sessionId: session.id, userId: actor.id }, 'Work timer stopped');
  return { session, durationMinutes: sessionMinutes(session.startedAt, now) };
}

export async function updateSession(
  actor: Actor,
  { sessionId, clientId, note, startedAt, endedAt }: UpdateSessionInput,
  now: Date,
) {
  const session = await loadModifiable(actor, sessionId);
  if (session.endedAt === null) {
    throw new TimerError(MESSAGES.TIMER.STOP_ERROR);
  }
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  if (end <= start || end > now) {
    throw new TimerError(MESSAGES.TIMER.INVALID_RANGE);
  }
  await assertOptionalClient(actor, clientId);
  return workSessionRepository.update(sessionId, {
    clientId,
    note,
    startedAt: start,
    endedAt: end,
  });
}

export async function deleteSession(actor: Actor, { sessionId }: SessionIdInput) {
  await loadModifiable(actor, sessionId);
  await workSessionRepository.delete(sessionId);
  logger.info({ sessionId, actorId: actor.id }, 'Work session deleted');
  return { sessionId };
}

// Turns a finished session into a Time Tracking entry for the session's owner.
export async function logSessionToTimeTracking(
  actor: Actor,
  { sessionId }: SessionIdInput,
  timeZone: string,
) {
  const session = await loadModifiable(actor, sessionId);
  if (session.endedAt === null) {
    throw new TimerError(MESSAGES.TIMER.STOP_ERROR);
  }
  if (session.timeEntryId !== null) {
    throw new TimerError(MESSAGES.TIMER.ALREADY_LOGGED);
  }
  if (session.clientId === null) {
    throw new TimerError(MESSAGES.TIMER.NEEDS_CLIENT);
  }
  await assertClientAccess(actor, session.clientId);
  const entry = await timeEntryRepository.create({
    clientId: session.clientId,
    userId: session.userId,
    categoryId: null,
    dateKey: todayKey(timeZone, session.startedAt),
    durationMinutes: billableSessionMinutes(session.startedAt, session.endedAt),
    task: session.note ?? DEFAULT_SESSION_TASK,
    requestedBy: null,
    link: null,
    needsReview: false,
  });
  await workSessionRepository.update(sessionId, { timeEntryId: entry.id });
  logger.info({ sessionId, entryId: entry.id, actorId: actor.id }, 'Work session logged');
  return { entryId: entry.id };
}
