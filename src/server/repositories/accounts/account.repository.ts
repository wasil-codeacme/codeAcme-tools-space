import type { AccountAccessLevel } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import type { AccountView } from '@/types/accounts';

export interface AccountData {
  clientId: string | null;
  name: string;
  purpose: string | null;
  accessLevel: AccountAccessLevel | null;
  url: string | null;
  username: string | null;
  twoFactor: string | null;
  notes: string | null;
}

export interface AccountCiphertexts {
  secretCiphertext?: string;
  secureNotesCiphertext?: string;
}

interface ListFilter {
  // Null lists every client; internal accounts are added only when includeInternal is set.
  clientIds: readonly string[] | null;
  includeInternal: boolean;
  includeArchived: boolean;
}

const VIEW_INCLUDE = {
  client: { select: { name: true } },
  updatedBy: { select: { name: true } },
} as const;

interface AccountRow extends AccountData {
  id: string;
  secretCiphertext: string | null;
  secureNotesCiphertext: string | null;
  secretUpdatedAt: Date | null;
  isArchived: boolean;
  updatedAt: Date;
  client: { name: string } | null;
  updatedBy: { name: string } | null;
}

// Strips ciphertexts: list views only ever learn whether a secret exists.
function toView(row: AccountRow): AccountView {
  return {
    id: row.id,
    clientId: row.clientId,
    clientName: row.client?.name ?? null,
    name: row.name,
    purpose: row.purpose,
    accessLevel: row.accessLevel,
    url: row.url,
    username: row.username,
    twoFactor: row.twoFactor,
    notes: row.notes,
    hasSecret: row.secretCiphertext !== null,
    hasSecureNotes: row.secureNotesCiphertext !== null,
    secretUpdatedAt: row.secretUpdatedAt?.toISOString() ?? null,
    isArchived: row.isArchived,
    updatedByName: row.updatedBy?.name ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function scopeWhere({ clientIds, includeInternal }: ListFilter) {
  const clientScope =
    clientIds === null ? { clientId: { not: null } } : { clientId: { in: [...clientIds] } };
  return includeInternal ? { OR: [clientScope, { clientId: null }] } : clientScope;
}

export const accountRepository = {
  findById(id: string) {
    return prisma.account.findUnique({ where: { id } });
  },

  async findViewById(id: string): Promise<AccountView | null> {
    const row = await prisma.account.findUnique({ where: { id }, include: VIEW_INCLUDE });
    return row ? toView(row) : null;
  },

  async list(filter: ListFilter): Promise<AccountView[]> {
    const rows = await prisma.account.findMany({
      where: { ...scopeWhere(filter), ...(filter.includeArchived ? {} : { isArchived: false }) },
      include: VIEW_INCLUDE,
      orderBy: [{ isArchived: 'asc' }, { name: 'asc' }],
    });
    return rows.map(toView);
  },

  async create(
    data: AccountData & AccountCiphertexts & { updatedById: string },
  ): Promise<AccountView> {
    const row = await prisma.account.create({
      data: { ...data, secretUpdatedAt: data.secretCiphertext ? new Date() : null },
      include: VIEW_INCLUDE,
    });
    return toView(row);
  },

  async update(
    id: string,
    data: Partial<AccountData> & AccountCiphertexts & { updatedById: string; isArchived?: boolean },
  ): Promise<AccountView> {
    const row = await prisma.account.update({
      where: { id },
      data: { ...data, ...(data.secretCiphertext ? { secretUpdatedAt: new Date() } : {}) },
      include: VIEW_INCLUDE,
    });
    return toView(row);
  },
};
