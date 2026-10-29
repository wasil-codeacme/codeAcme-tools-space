import { type ToolAccessLevel } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

export const userToolAccessRepository = {
  async set(userId: string, toolId: string, level: ToolAccessLevel | null): Promise<void> {
    if (level === null) {
      await prisma.userToolAccess.deleteMany({ where: { userId, toolId } });
      return;
    }
    await prisma.userToolAccess.upsert({
      where: { userId_toolId: { userId, toolId } },
      create: { userId, toolId, level },
      update: { level },
    });
  },

  async grantMany(
    userId: string,
    grants: readonly { toolId: string; level: ToolAccessLevel }[],
  ): Promise<void> {
    await prisma.userToolAccess.createMany({
      data: grants.map((grant) => ({ userId, ...grant })),
      skipDuplicates: true,
    });
  },
};
