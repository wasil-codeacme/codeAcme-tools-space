'use server';

import { MESSAGES } from '@/lib/messages';
import { writeAction } from '@/server/actions/action';
import { mailer } from '@/server/container';
import * as userService from '@/server/services/user.service';
import {
  createUserSchema,
  resetUserPasswordSchema,
  setToolAccessSchema,
  setUserActiveSchema,
  updateUserSchema,
} from '@/server/validators/user.schema';

export const createUser = writeAction({
  input: createUserSchema,
  requireAdmin: true,
  fallback: MESSAGES.USER.CREATE_ERROR,
  logMessage: 'Create team member failed',
  run: (input) => userService.createUser(mailer, input),
});

export const updateUser = writeAction({
  input: updateUserSchema,
  requireAdmin: true,
  fallback: MESSAGES.USER.UPDATE_ERROR,
  logMessage: 'Update team member failed',
  run: (input, actor) => userService.updateUser(actor, input),
});

export const setUserActive = writeAction({
  input: setUserActiveSchema,
  requireAdmin: true,
  fallback: MESSAGES.USER.UPDATE_ERROR,
  logMessage: 'Change team member status failed',
  run: (input, actor) => userService.setUserActive(actor, input),
});

export const resetUserPassword = writeAction({
  input: resetUserPasswordSchema,
  requireAdmin: true,
  fallback: MESSAGES.USER.UPDATE_ERROR,
  logMessage: 'Reset team member password failed',
  run: (input, actor) => userService.resetUserPassword(actor, input),
});

export const setToolAccess = writeAction({
  input: setToolAccessSchema,
  requireAdmin: true,
  fallback: MESSAGES.USER.ACCESS_ERROR,
  logMessage: 'Set tool access failed',
  run: (input, actor) => userService.setToolAccess(actor, input),
});
