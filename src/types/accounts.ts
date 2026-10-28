import type { AccountAccessLevel, AccountAuditAction } from '@/generated/prisma/enums';

export const SecretField = {
  SECRET: 'secret',
  SECURE_NOTES: 'secureNotes',
} as const;

export type SecretField = (typeof SecretField)[keyof typeof SecretField];

export const RevealIntent = {
  REVEAL: 'reveal',
  COPY: 'copy',
} as const;

export type RevealIntent = (typeof RevealIntent)[keyof typeof RevealIntent];

// What the browser gets for an account: everything except the secret values themselves.
export interface AccountView {
  id: string;
  clientId: string | null;
  clientName: string | null;
  name: string;
  purpose: string | null;
  accessLevel: AccountAccessLevel | null;
  url: string | null;
  username: string | null;
  twoFactor: string | null;
  notes: string | null;
  hasSecret: boolean;
  hasSecureNotes: boolean;
  secretUpdatedAt: string | null;
  isArchived: boolean;
  updatedByName: string | null;
  updatedAt: string;
}

export interface AccountAuditView {
  id: string;
  accountName: string;
  clientName: string | null;
  userName: string;
  action: AccountAuditAction;
  createdAt: string;
}

export interface ImportedAccountRow {
  name: string;
  purpose: string | null;
  url: string | null;
  username: string | null;
  accessLevel: AccountAccessLevel | null;
  twoFactor: string | null;
}
