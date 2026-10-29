import 'server-only';
import { Role } from '@/generated/prisma/enums';
import { ArchivedClientError, ForbiddenError, NotFoundError } from '@/server/errors';
import { clientMemberRepository } from '@/server/repositories/time-tracking/client-member.repository';
import { clientRepository } from '@/server/repositories/time-tracking/client.repository';
import type { Actor } from '@/types/auth';
import type { ClientSummary } from '@/types/time-tracking';

// The single rule for who may touch a client's time data, shared by every time-tracking service.
// Admins see every client; members only clients they are assigned to.

interface AccessOptions {
  allowArchived?: boolean;
}

export function isAdmin(actor: Actor): boolean {
  return actor.role === Role.ADMIN;
}

export async function assertClientAccess(
  actor: Actor,
  clientId: string,
  { allowArchived = false }: AccessOptions = {},
): Promise<ClientSummary> {
  // Both lookups at once: one round trip of latency instead of two.
  const [client, isMember] = await Promise.all([
    clientRepository.findById(clientId),
    isAdmin(actor) ? Promise.resolve(true) : clientMemberRepository.exists(clientId, actor.id),
  ]);
  if (!client) {
    throw new NotFoundError('Client');
  }
  if (!isMember) {
    // Same error as a missing client, so members cannot probe for client ids.
    throw new NotFoundError('Client');
  }
  if (client.isArchived && !allowArchived) {
    throw new ArchivedClientError();
  }
  return client;
}

export function listAccessibleClients(
  actor: Actor,
  { includeArchived = false }: { includeArchived?: boolean } = {},
): Promise<ClientSummary[]> {
  return clientRepository.list({
    includeArchived,
    memberUserId: isAdmin(actor) ? undefined : actor.id,
  });
}

export function assertCanModifyEntry(actor: Actor, entryOwnerId: string): void {
  if (!isAdmin(actor) && actor.id !== entryOwnerId) {
    throw new ForbiddenError('Only the author or an admin can change this entry');
  }
}
