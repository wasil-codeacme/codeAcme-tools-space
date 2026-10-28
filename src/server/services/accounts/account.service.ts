import 'server-only';
import { AccountAuditAction } from '@/generated/prisma/enums';
import { ACCOUNT_ACTIVITY_PAGE_SIZE } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { decryptSecret, encryptSecret } from '@/lib/secret-cipher';
import { ForbiddenError, NotFoundError } from '@/server/errors';
import {
  assertClientAccess,
  isAdmin,
  listAccessibleClients,
} from '@/server/policies/client-access.policy';
import { accountAuditRepository } from '@/server/repositories/accounts/account-audit.repository';
import { accountRepository } from '@/server/repositories/accounts/account.repository';
import type { Actor } from '@/types/auth';
import { type AccountView, RevealIntent, SecretField } from '@/types/accounts';
import type {
  AccountFields,
  ImportAccountsInput,
  RevealSecretInput,
  SetAccountArchivedInput,
  UpdateAccountInput,
} from '@/server/validators/accounts/account.schema';

// Internal (clientId = null) accounts are admin-only; client accounts follow client assignments.
async function assertScope(actor: Actor, clientId: string | null): Promise<void> {
  if (clientId === null) {
    if (!isAdmin(actor)) {
      throw new ForbiddenError('Internal accounts are admin-only');
    }
    return;
  }
  await assertClientAccess(actor, clientId, { allowArchived: isAdmin(actor) });
}

async function loadAccessible(actor: Actor, accountId: string) {
  const account = await accountRepository.findById(accountId);
  if (!account) {
    throw new NotFoundError('Account');
  }
  if (account.clientId === null && !isAdmin(actor)) {
    // Same answer as a missing account, so members cannot probe for internal ids.
    throw new NotFoundError('Account');
  }
  await assertScope(actor, account.clientId);
  return account;
}

function ciphertexts({ secret, secureNotes }: Pick<AccountFields, 'secret' | 'secureNotes'>) {
  return {
    ...(secret ? { secretCiphertext: encryptSecret(secret) } : {}),
    ...(secureNotes ? { secureNotesCiphertext: encryptSecret(secureNotes) } : {}),
  };
}

export async function listAccounts(
  actor: Actor,
  { includeArchived = false }: { includeArchived?: boolean } = {},
): Promise<AccountView[]> {
  if (isAdmin(actor)) {
    return accountRepository.list({ clientIds: null, includeInternal: true, includeArchived });
  }
  const clients = await listAccessibleClients(actor);
  return accountRepository.list({
    clientIds: clients.map((client) => client.id),
    includeInternal: false,
    includeArchived: false,
  });
}

export async function createAccount(actor: Actor, fields: AccountFields): Promise<AccountView> {
  await assertScope(actor, fields.clientId);
  const { secret, secureNotes, ...data } = fields;
  const account = await accountRepository.create({
    ...data,
    ...ciphertexts({ secret, secureNotes }),
    updatedById: actor.id,
  });
  await accountAuditRepository.record(account.id, actor.id, AccountAuditAction.CREATED);
  logger.info({ accountId: account.id, actorId: actor.id }, 'Account created');
  return account;
}

export async function updateAccount(
  actor: Actor,
  { accountId, secret, secureNotes, ...data }: UpdateAccountInput,
): Promise<AccountView> {
  await loadAccessible(actor, accountId);
  await assertScope(actor, data.clientId);
  const account = await accountRepository.update(accountId, {
    ...data,
    ...ciphertexts({ secret, secureNotes }),
    updatedById: actor.id,
  });
  const action =
    secret || secureNotes ? AccountAuditAction.SECRET_CHANGED : AccountAuditAction.UPDATED;
  await accountAuditRepository.record(accountId, actor.id, action);
  logger.info({ accountId, actorId: actor.id, action }, 'Account updated');
  return account;
}

export async function setAccountArchived(
  actor: Actor,
  { accountId, isArchived }: SetAccountArchivedInput,
): Promise<AccountView> {
  await loadAccessible(actor, accountId);
  const account = await accountRepository.update(accountId, { isArchived, updatedById: actor.id });
  await accountAuditRepository.record(
    accountId,
    actor.id,
    isArchived ? AccountAuditAction.ARCHIVED : AccountAuditAction.RESTORED,
  );
  return account;
}

// The audit row is written before decrypting: if it cannot be recorded, the secret is not shown.
export async function revealSecret(
  actor: Actor,
  { accountId, field, intent }: RevealSecretInput,
): Promise<{ value: string }> {
  const account = await loadAccessible(actor, accountId);
  const ciphertext =
    field === SecretField.SECRET ? account.secretCiphertext : account.secureNotesCiphertext;
  if (!ciphertext) {
    throw new NotFoundError('Secret');
  }
  await accountAuditRepository.record(
    accountId,
    actor.id,
    intent === RevealIntent.COPY ? AccountAuditAction.COPIED : AccountAuditAction.REVEALED,
  );
  logger.info({ accountId, actorId: actor.id, field, intent }, 'Account secret accessed');
  return { value: decryptSecret(ciphertext) };
}

export async function importAccounts(
  actor: Actor,
  { clientId, rows }: ImportAccountsInput,
): Promise<{ count: number }> {
  await assertScope(actor, clientId);
  const created: AccountView[] = [];
  for (const row of rows) {
    created.push(
      await accountRepository.create({ ...row, clientId, notes: null, updatedById: actor.id }),
    );
  }
  await accountAuditRepository.recordMany(
    created.map((account) => account.id),
    actor.id,
    AccountAuditAction.CREATED,
  );
  logger.info({ clientId, actorId: actor.id, count: created.length }, 'Accounts imported');
  return { count: created.length };
}

export function listAccountActivity() {
  return accountAuditRepository.listRecent(ACCOUNT_ACTIVITY_PAGE_SIZE);
}
