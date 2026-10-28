'use server';

import { ToolId } from '@/config/tools';
import { MESSAGES } from '@/lib/messages';
import { writeAction } from '@/server/actions/action';
import * as accountService from '@/server/services/accounts/account.service';
import {
  accountFieldsSchema,
  importAccountsSchema,
  revealSecretSchema,
  setAccountArchivedSchema,
  updateAccountSchema,
} from '@/server/validators/accounts/account.schema';

const ACCOUNTS = { tool: ToolId.ACCOUNTS } as const;

export const createAccount = writeAction({
  ...ACCOUNTS,
  input: accountFieldsSchema,
  fallback: MESSAGES.ACCOUNT.CREATE_ERROR,
  logMessage: 'Create account failed',
  run: (input, actor) => accountService.createAccount(actor, input),
});

export const updateAccount = writeAction({
  ...ACCOUNTS,
  input: updateAccountSchema,
  fallback: MESSAGES.ACCOUNT.UPDATE_ERROR,
  logMessage: 'Update account failed',
  run: (input, actor) => accountService.updateAccount(actor, input),
});

export const setAccountArchived = writeAction({
  ...ACCOUNTS,
  requireAdmin: true,
  input: setAccountArchivedSchema,
  fallback: MESSAGES.ACCOUNT.UPDATE_ERROR,
  logMessage: 'Archive account failed',
  run: (input, actor) => accountService.setAccountArchived(actor, input),
});

// A write action because every reveal is recorded in the audit trail.
export const revealAccountSecret = writeAction({
  ...ACCOUNTS,
  input: revealSecretSchema,
  fallback: MESSAGES.ACCOUNT.REVEAL_ERROR,
  logMessage: 'Reveal account secret failed',
  run: (input, actor) => accountService.revealSecret(actor, input),
});

export const importAccounts = writeAction({
  ...ACCOUNTS,
  input: importAccountsSchema,
  fallback: MESSAGES.ACCOUNT.IMPORT_ERROR,
  logMessage: 'Import accounts failed',
  run: (input, actor) => accountService.importAccounts(actor, input),
});
