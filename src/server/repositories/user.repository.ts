import { Role } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

const PUBLIC_USER_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  toolAccess: { select: { toolId: true, level: true } },
} as const;

export const userRepository = {
  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  // One query for everything a request needs to authorise the signed-in user.
  findSessionUser(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        sessionVersion: true,
        toolAccess: { select: { toolId: true, level: true } },
      },
    });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  list() {
    return prisma.user.findMany({
      select: PUBLIC_USER_FIELDS,
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  },

  listActive() {
    return prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
  },

  create(data: { name: string; email: string; role: Role; passwordHash: string }) {
    return prisma.user.create({ data, select: PUBLIC_USER_FIELDS });
  },

  update(id: string, data: { name?: string; role?: Role; isActive?: boolean }) {
    // Deactivation bumps the session version so open sessions die immediately.
    const revokeSessions = data.isActive === false ? { sessionVersion: { increment: 1 } } : {};
    return prisma.user.update({
      where: { id },
      data: { ...data, ...revokeSessions },
      select: PUBLIC_USER_FIELDS,
    });
  },

  setPassword(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { passwordHash, sessionVersion: { increment: 1 } },
      select: { id: true, sessionVersion: true },
    });
  },

  countActiveAdmins() {
    return prisma.user.count({ where: { role: Role.ADMIN, isActive: true } });
  },
};
