'use server';

import { ToolId } from '@/config/tools';
import { MESSAGES } from '@/lib/messages';
import { writeAction } from '@/server/actions/action';
import * as workSessionService from '@/server/services/work-timer/work-session.service';
import { getUserTimeZone } from '@/server/time-zone';
import {
  sessionIdSchema,
  startSessionSchema,
  updateSessionSchema,
} from '@/server/validators/work-timer/work-session.schema';
import { z } from 'zod';

const WORK_TIMER = { tool: ToolId.WORK_TIMER } as const;

export const startWorkSession = writeAction({
  ...WORK_TIMER,
  input: startSessionSchema,
  fallback: MESSAGES.TIMER.START_ERROR,
  logMessage: 'Start work timer failed',
  run: (input, actor) => workSessionService.startSession(actor, input, new Date()),
});

export const stopWorkSession = writeAction({
  ...WORK_TIMER,
  input: z.object({}),
  fallback: MESSAGES.TIMER.STOP_ERROR,
  logMessage: 'Stop work timer failed',
  run: (_input, actor) => workSessionService.stopSession(actor, new Date()),
});

export const updateWorkSession = writeAction({
  ...WORK_TIMER,
  input: updateSessionSchema,
  fallback: MESSAGES.TIMER.UPDATE_ERROR,
  logMessage: 'Update work session failed',
  run: (input, actor) => workSessionService.updateSession(actor, input, new Date()),
});

export const deleteWorkSession = writeAction({
  ...WORK_TIMER,
  input: sessionIdSchema,
  fallback: MESSAGES.TIMER.DELETE_ERROR,
  logMessage: 'Delete work session failed',
  run: (input, actor) => workSessionService.deleteSession(actor, input),
});

export const logWorkSession = writeAction({
  ...WORK_TIMER,
  input: sessionIdSchema,
  fallback: MESSAGES.TIMER.LOG_ERROR,
  logMessage: 'Log work session failed',
  run: async (input, actor) =>
    workSessionService.logSessionToTimeTracking(actor, input, await getUserTimeZone()),
});
