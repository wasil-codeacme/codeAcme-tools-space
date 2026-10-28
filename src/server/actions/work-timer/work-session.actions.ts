'use server';

import { ToolId } from '@/config/tools';
import { MESSAGES } from '@/lib/messages';
import { writeAction } from '@/server/actions/action';
import * as workSessionService from '@/server/services/work-timer/work-session.service';
import { getUserTimeZone } from '@/server/time-zone';
import {
  recordSessionSchema,
  sessionIdSchema,
  updateSessionSchema,
} from '@/server/validators/work-timer/work-session.schema';

const WORK_TIMER = { tool: ToolId.WORK_TIMER } as const;

export const recordWorkSession = writeAction({
  ...WORK_TIMER,
  input: recordSessionSchema,
  fallback: MESSAGES.TIMER.STOP_ERROR,
  logMessage: 'Record work session failed',
  run: (input, actor) => workSessionService.recordSession(actor, input),
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
