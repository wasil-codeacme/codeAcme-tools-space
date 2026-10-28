import { Role } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { fromDateKey } from '@/lib/time-tracking/date-key';
import type { Actor } from '@/types/auth';

export const TEST_PASSWORD = 'correct-horse-battery';

let sequence = 0;
function nextId(): number {
  sequence += 1;
  return sequence;
}

export async function createTestUser(
  role: Role = Role.MEMBER,
  overrides: { isActive?: boolean } = {},
) {
  const id = nextId();
  return prisma.user.create({
    data: {
      name: `Person ${id}`,
      email: `person${id}@example.test`,
      role,
      passwordHash: await hashPassword(TEST_PASSWORD),
      ...overrides,
    },
  });
}

export function asActor(user: { id: string; role: Role }): Actor {
  return { id: user.id, role: user.role };
}

export async function createTestClient(
  overrides: { monthlyLimitMinutes?: number | null; isArchived?: boolean } = {},
) {
  const id = nextId();
  return prisma.client.create({
    data: { name: `Client ${id}`, slug: `client-${id}`, monthlyLimitMinutes: null, ...overrides },
  });
}

export function assignToClient(clientId: string, userId: string) {
  return prisma.clientMember.create({ data: { clientId, userId } });
}

export function createTestCategory(clientId: string, overrides: { isArchived?: boolean } = {}) {
  const id = nextId();
  return prisma.timeCategory.create({
    data: { clientId, name: `Category ${id}`, sortOrder: id, ...overrides },
  });
}

export function createTestEntry(
  clientId: string,
  userId: string,
  overrides: { dateKey?: string; durationMinutes?: number; categoryId?: string | null } = {},
) {
  return prisma.timeEntry.create({
    data: {
      clientId,
      userId,
      categoryId: overrides.categoryId ?? null,
      workDate: fromDateKey(overrides.dateKey ?? '2026-10-21'),
      durationMinutes: overrides.durationMinutes ?? 30,
      task: 'Something useful',
    },
  });
}
