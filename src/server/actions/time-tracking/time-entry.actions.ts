'use server';

import { ToolId } from '@/config/tools';
import { MESSAGES } from '@/lib/messages';
import { writeAction } from '@/server/actions/action';
import * as timeEntryService from '@/server/services/time-tracking/time-entry.service';
import {
  deleteEntrySchema,
  entryFieldsSchema,
  importEntriesSchema,
  restoreEntrySchema,
  updateEntrySchema,
} from '@/server/validators/time-tracking/time-entry.schema';

const TIME_TRACKING = { tool: ToolId.TIME_TRACKING } as const;

export const createTimeEntry = writeAction({
  ...TIME_TRACKING,
  input: entryFieldsSchema,
  fallback: MESSAGES.ENTRY.CREATE_ERROR,
  logMessage: 'Log time failed',
  run: (input, actor) => timeEntryService.logEntry(actor, input),
});

export const updateTimeEntry = writeAction({
  ...TIME_TRACKING,
  input: updateEntrySchema,
  fallback: MESSAGES.ENTRY.UPDATE_ERROR,
  logMessage: 'Update time entry failed',
  run: (input, actor) => timeEntryService.updateEntry(actor, input),
});

export const deleteTimeEntry = writeAction({
  ...TIME_TRACKING,
  input: deleteEntrySchema,
  fallback: MESSAGES.ENTRY.DELETE_ERROR,
  logMessage: 'Delete time entry failed',
  run: (input, actor) => timeEntryService.deleteEntry(actor, input),
});

export const restoreTimeEntry = writeAction({
  ...TIME_TRACKING,
  input: restoreEntrySchema,
  fallback: MESSAGES.ENTRY.CREATE_ERROR,
  logMessage: 'Restore time entry failed',
  run: (input, actor) => timeEntryService.restoreEntry(actor, input),
});

export const importTimeEntries = writeAction({
  ...TIME_TRACKING,
  input: importEntriesSchema,
  fallback: MESSAGES.ENTRY.IMPORT_ERROR,
  logMessage: 'Import time entries failed',
  run: (input, actor) => timeEntryService.importEntries(actor, input),
});
