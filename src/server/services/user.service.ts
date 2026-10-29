import 'server-only';
import { Role } from '@/generated/prisma/enums';
import { welcomeEmail } from '@/lib/emails/account-emails';
import { logger } from '@/lib/logger';
import { hashPassword } from '@/lib/password';
import { EmailTakenError, LastAdminError, NotFoundError, SelfActionError } from '@/server/errors';
import type { Mailer } from '@/server/ports/mailer.port';
import { userRepository } from '@/server/repositories/user.repository';
import { runSideEffect } from '@/server/side-effect';
import type { Actor } from '@/types/auth';
import type {
  CreateUserInput,
  ResetUserPasswordInput,
  SetUserActiveInput,
  UpdateUserInput,
} from '@/server/validators/user.schema';

export function listUsers() {
  return userRepository.list();
}

export function listActiveUsers() {
  return userRepository.listActive();
}

export async function createUser(mailer: Mailer, { name, email, role, password }: CreateUserInput) {
  if (await userRepository.findByEmail(email)) {
    throw new EmailTakenError();
  }
  const user = await userRepository.create({
    name,
    email,
    role,
    passwordHash: await hashPassword(password),
  });
  logger.info({ userId: user.id, role }, 'Team member created');
  await runSideEffect('welcome-email', () =>
    mailer.send({ to: email, ...welcomeEmail({ name, email, temporaryPassword: password }) }),
  );
  return user;
}

// Demoting or deactivating the last active admin would lock everyone out of team management.
async function assertNotRemovingLastAdmin(userId: string, removesAdminAccess: boolean) {
  if (!removesAdminAccess) {
    return;
  }
  const target = await userRepository.findById(userId);
  if (!target) {
    throw new NotFoundError('User');
  }
  if (target.role === Role.ADMIN && target.isActive) {
    if ((await userRepository.countActiveAdmins()) <= 1) {
      throw new LastAdminError();
    }
  }
}

export async function updateUser(actor: Actor, { userId, name, role }: UpdateUserInput) {
  const isDemotion = role !== Role.ADMIN;
  if (actor.id === userId && isDemotion && actor.role === Role.ADMIN) {
    throw new SelfActionError();
  }
  await assertNotRemovingLastAdmin(userId, isDemotion);
  const user = await userRepository.update(userId, { name, role });
  logger.info({ userId, role, actorId: actor.id }, 'Team member updated');
  return user;
}

export async function setUserActive(actor: Actor, { userId, isActive }: SetUserActiveInput) {
  if (actor.id === userId) {
    throw new SelfActionError();
  }
  await assertNotRemovingLastAdmin(userId, !isActive);
  const user = await userRepository.update(userId, { isActive });
  logger.info({ userId, isActive, actorId: actor.id }, 'Team member status changed');
  return user;
}

export async function resetUserPassword(
  actor: Actor,
  { userId, password }: ResetUserPasswordInput,
) {
  if (actor.id === userId) {
    throw new SelfActionError();
  }
  if (!(await userRepository.findById(userId))) {
    throw new NotFoundError('User');
  }
  await userRepository.setPassword(userId, await hashPassword(password));
  logger.info({ userId, actorId: actor.id }, 'Team member password reset');
  return { userId };
}
