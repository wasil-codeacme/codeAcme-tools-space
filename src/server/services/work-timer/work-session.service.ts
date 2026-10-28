import 'server-only';
import { WORK_TIMER_HISTORY_DAYS } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { MESSAGES } from '@/lib/messages';
import { todayKey } from '@/lib/time-tracking/date-key';
import { billableSessionMinutes } from '@/lib/work-timer/session-history';
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
  RecordSessionInput,
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

const MILLISECONDS_PER_SECOND = 1000;
// Rounding between the browser's stopwatch and its start/stop timestamps.
const WORKED_SECONDS_TOLERANCE = 1;

// Saves a session timed in the browser. A pause-aware worked time must fit inside the start-to-stop
// range; times come from the user's device, so they are not compared with the server clock.
export async function recordSession(
  actor: Actor,
  { legacySessionId, clientId, note, startedAt, endedAt, workedSeconds }: RecordSessionInput,
): Promise<WorkSessionView> {
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  const rangeSeconds = (end.getTime() - start.getTime()) / MILLISECONDS_PER_SECOND;
  if (end <= start || workedSeconds > rangeSeconds + WORKED_SECONDS_TOLERANCE) {
    throw new TimerError(MESSAGES.TIMER.INVALID_RANGE);
  }
  await assertOptionalClient(actor, clientId);
  const fields = { clientId, note, startedAt: start, endedAt: end, workedSeconds };

  if (legacySessionId) {
    const legacy = await workSessionRepository.findById(legacySessionId);
    if (!legacy || legacy.userId !== actor.id || legacy.endedAt !== null) {
      throw new NotFoundError('Work session');
    }
    const session = await workSessionRepository.update(legacySessionId, fields);
    logger.info({ sessionId: session.id, userId: actor.id }, 'Legacy work session finished');
    return session;
  }

  const session = await workSessionRepository.create({ ...fields, userId: actor.id });
  logger.info({ sessionId: session.id, userId: actor.id, workedSeconds }, 'Work session recorded');
  return session;
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
    durationMinutes: billableSessionMinutes({
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      workedSeconds: session.workedSeconds,
    }),
    task: session.note ?? DEFAULT_SESSION_TASK,
    requestedBy: null,
    link: null,
    needsReview: false,
  });
  await workSessionRepository.update(sessionId, { timeEntryId: entry.id });
  logger.info({ sessionId, entryId: entry.id, actorId: actor.id }, 'Work session logged');
  return { entryId: entry.id };
}
