'use server';

import { ToolId } from '@/config/tools';
import { MESSAGES } from '@/lib/messages';
import { writeAction } from '@/server/actions/action';
import * as clientMemberService from '@/server/services/time-tracking/client-member.service';
import * as clientService from '@/server/services/time-tracking/client.service';
import * as categoryService from '@/server/services/time-tracking/time-category.service';
import {
  clientFieldsSchema,
  clientMembershipSchema,
  createCategorySchema,
  renameCategorySchema,
  setCategoryArchivedSchema,
  setClientArchivedSchema,
  updateClientSchema,
} from '@/server/validators/time-tracking/client.schema';

const ADMIN_TIME_TRACKING = { requireAdmin: true, tool: ToolId.TIME_TRACKING } as const;

export const createClient = writeAction({
  ...ADMIN_TIME_TRACKING,
  input: clientFieldsSchema,
  fallback: MESSAGES.CLIENT.CREATE_ERROR,
  logMessage: 'Create client failed',
  run: (input) => clientService.createClient(input),
});

export const updateClient = writeAction({
  ...ADMIN_TIME_TRACKING,
  input: updateClientSchema,
  fallback: MESSAGES.CLIENT.UPDATE_ERROR,
  logMessage: 'Update client failed',
  run: (input) => clientService.updateClient(input),
});

export const setClientArchived = writeAction({
  ...ADMIN_TIME_TRACKING,
  input: setClientArchivedSchema,
  fallback: MESSAGES.CLIENT.UPDATE_ERROR,
  logMessage: 'Archive client failed',
  run: (input) => clientService.setClientArchived(input),
});

export const assignClientMember = writeAction({
  ...ADMIN_TIME_TRACKING,
  input: clientMembershipSchema,
  fallback: MESSAGES.CLIENT.MEMBERSHIP_ERROR,
  logMessage: 'Assign client member failed',
  run: (input) => clientMemberService.assignMember(input),
});

export const removeClientMember = writeAction({
  ...ADMIN_TIME_TRACKING,
  input: clientMembershipSchema,
  fallback: MESSAGES.CLIENT.MEMBERSHIP_ERROR,
  logMessage: 'Remove client member failed',
  run: (input) => clientMemberService.removeMember(input),
});

export const createCategory = writeAction({
  ...ADMIN_TIME_TRACKING,
  input: createCategorySchema,
  fallback: MESSAGES.CATEGORY.ERROR,
  logMessage: 'Create category failed',
  run: (input) => categoryService.createCategory(input),
});

export const renameCategory = writeAction({
  ...ADMIN_TIME_TRACKING,
  input: renameCategorySchema,
  fallback: MESSAGES.CATEGORY.ERROR,
  logMessage: 'Rename category failed',
  run: (input) => categoryService.renameCategory(input),
});

export const setCategoryArchived = writeAction({
  ...ADMIN_TIME_TRACKING,
  input: setCategoryArchivedSchema,
  fallback: MESSAGES.CATEGORY.ERROR,
  logMessage: 'Archive category failed',
  run: (input) => categoryService.setCategoryArchived(input),
});
