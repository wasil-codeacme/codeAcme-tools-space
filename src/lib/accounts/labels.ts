import { AccountAccessLevel, AccountAuditAction, SecretLocation } from '@/generated/prisma/enums';

export const ACCESS_LEVEL_LABELS: Record<AccountAccessLevel, string> = {
  [AccountAccessLevel.MASTER]: 'Master',
  [AccountAccessLevel.ADMIN]: 'Admin',
  [AccountAccessLevel.USER]: 'User',
};

export const SECRET_LOCATION_LABELS: Record<SecretLocation, string> = {
  [SecretLocation.TOOLS_VAULT]: 'Stored here (encrypted)',
  [SecretLocation.BITWARDEN]: 'Bitwarden',
  [SecretLocation.ONE_PASSWORD]: '1Password',
  [SecretLocation.CLIENT_HOLDS]: 'Client keeps it',
  [SecretLocation.OTHER]: 'Somewhere else',
};

export const AUDIT_ACTION_LABELS: Record<AccountAuditAction, string> = {
  [AccountAuditAction.CREATED]: 'Created',
  [AccountAuditAction.UPDATED]: 'Edited details',
  [AccountAuditAction.SECRET_CHANGED]: 'Changed secret',
  [AccountAuditAction.REVEALED]: 'Revealed secret',
  [AccountAuditAction.COPIED]: 'Copied secret',
  [AccountAuditAction.ARCHIVED]: 'Archived',
  [AccountAuditAction.RESTORED]: 'Restored',
};

// Filter and form value for accounts that belong to CodeAcme itself rather than a client.
export const INTERNAL_SCOPE = 'internal';
export const INTERNAL_SCOPE_LABEL = 'CodeAcme internal';
export const ALL_SCOPES = 'all';
