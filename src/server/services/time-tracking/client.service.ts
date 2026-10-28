import 'server-only';
import { logger } from '@/lib/logger';
import { slugify } from '@/lib/slugify';
import { hoursToMinutes } from '@/lib/time-tracking/duration';
import {
  type DateKey,
  formatDateKey,
  monthEndKey,
  monthStartKey,
} from '@/lib/time-tracking/date-key';
import { toMonthUsage } from '@/lib/time-tracking/usage';
import { ClientNameTakenError } from '@/server/errors';
import { assertClientAccess, listAccessibleClients } from '@/server/policies/client-access.policy';
import { clientRepository } from '@/server/repositories/time-tracking/client.repository';
import { timeEntryRepository } from '@/server/repositories/time-tracking/time-entry.repository';
import type { Actor } from '@/types/auth';
import type { ClientSummary, ClientWithUsage } from '@/types/time-tracking';
import type {
  ClientFields,
  SetClientArchivedInput,
  UpdateClientInput,
} from '@/server/validators/time-tracking/client.schema';

export async function listClientsWithUsage(
  actor: Actor,
  { monthKey, includeArchived = false }: { monthKey: DateKey; includeArchived?: boolean },
): Promise<ClientWithUsage[]> {
  const clients = await listAccessibleClients(actor, { includeArchived });
  if (clients.length === 0) {
    return [];
  }
  const usedByClient = await timeEntryRepository.sumMinutesByClient({
    clientIds: clients.map((client) => client.id),
    startKey: monthStartKey(monthKey),
    endKey: monthEndKey(monthKey),
  });
  const monthLabel = formatDateKey(monthKey, 'MMMM yyyy');
  return clients.map((client) => ({
    ...client,
    usage: toMonthUsage(usedByClient.get(client.id) ?? 0, client.monthlyLimitMinutes, monthLabel),
  }));
}

export function getClient(actor: Actor, clientId: string): Promise<ClientSummary> {
  return assertClientAccess(actor, clientId, { allowArchived: true });
}

async function uniqueSlug(name: string, excludeClientId?: string): Promise<string> {
  const slug = slugify(name);
  const existing = await clientRepository.findBySlug(slug);
  if (existing && existing.id !== excludeClientId) {
    throw new ClientNameTakenError();
  }
  return slug;
}

function toClientData({ name, contactName, monthlyLimitHours }: ClientFields) {
  return {
    name,
    contactName,
    monthlyLimitMinutes: monthlyLimitHours === null ? null : hoursToMinutes(monthlyLimitHours),
  };
}

export async function createClient(fields: ClientFields): Promise<ClientSummary> {
  const client = await clientRepository.create({
    ...toClientData(fields),
    slug: await uniqueSlug(fields.name),
  });
  logger.info({ clientId: client.id }, 'Client created');
  return client;
}

export async function updateClient({ clientId, ...fields }: UpdateClientInput) {
  const client = await clientRepository.update(clientId, {
    ...toClientData(fields),
    slug: await uniqueSlug(fields.name, clientId),
  });
  logger.info({ clientId }, 'Client updated');
  return client;
}

export async function setClientArchived({ clientId, isArchived }: SetClientArchivedInput) {
  const client = await clientRepository.update(clientId, { isArchived });
  logger.info({ clientId, isArchived }, 'Client archive state changed');
  return client;
}
