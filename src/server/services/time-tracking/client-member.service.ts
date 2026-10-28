import 'server-only';
import { logger } from '@/lib/logger';
import { NotFoundError } from '@/server/errors';
import { clientMemberRepository } from '@/server/repositories/time-tracking/client-member.repository';
import { clientRepository } from '@/server/repositories/time-tracking/client.repository';
import { userRepository } from '@/server/repositories/user.repository';
import type { ClientMemberView } from '@/types/time-tracking';
import type { ClientMembershipInput } from '@/server/validators/time-tracking/client.schema';

export function listClientMembers(clientId: string): Promise<ClientMemberView[]> {
  return clientMemberRepository.listByClient(clientId);
}

export async function assignMember({ clientId, userId }: ClientMembershipInput) {
  const [client, user] = await Promise.all([
    clientRepository.findById(clientId),
    userRepository.findById(userId),
  ]);
  if (!client || !user) {
    throw new NotFoundError(client ? 'User' : 'Client');
  }
  await clientMemberRepository.add(clientId, userId);
  logger.info({ clientId, userId }, 'Member assigned to client');
  return { clientId, userId };
}

export async function removeMember({ clientId, userId }: ClientMembershipInput) {
  await clientMemberRepository.remove(clientId, userId);
  logger.info({ clientId, userId }, 'Member removed from client');
  return { clientId, userId };
}
