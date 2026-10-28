import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { z } from 'zod';
import { PrismaClient } from '@/generated/prisma/client';
import { Role } from '@/generated/prisma/enums';
import { hashPassword } from '@/lib/password';

// Idempotent: safe to run against any environment more than once. Creates the first admin and the
// clients that were tracked in spreadsheets before this app existed.

const seedEnvSchema = z.object({
  DATABASE_URL: z.url(),
  SEED_ADMIN_NAME: z.string().min(1),
  SEED_ADMIN_EMAIL: z.email(),
  SEED_ADMIN_PASSWORD: z.string().min(12),
});

const MINUTES_PER_HOUR = 60;
const THIRTY_K_CLUB_MONTHLY_LIMIT_HOURS = 20;

const SEED_CLIENTS = [
  {
    slug: 'the-30k-club',
    name: 'The 30k Club',
    contactName: 'Anna & Jo',
    monthlyLimitMinutes: THIRTY_K_CLUB_MONTHLY_LIMIT_HOURS * MINUTES_PER_HOUR,
    categories: [
      'Circle sessions: schedule, move, renewals',
      'Session checks: recordings, tiers, access',
      'Onboarding and offboarding clients',
      'Modules, courses, tiers and alumni',
      'Small fixes outside Circle',
      'Zoom and platform glitches',
      'Calls and messages with Anna and Jo',
    ],
  },
];

async function main() {
  const seedEnv = seedEnvSchema.parse(process.env);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: seedEnv.DATABASE_URL }),
  });

  try {
    const email = seedEnv.SEED_ADMIN_EMAIL.toLowerCase();
    const admin = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name: seedEnv.SEED_ADMIN_NAME,
        role: Role.ADMIN,
        passwordHash: await hashPassword(seedEnv.SEED_ADMIN_PASSWORD),
      },
      update: {},
    });

    for (const { categories, ...client } of SEED_CLIENTS) {
      const saved = await prisma.client.upsert({
        where: { slug: client.slug },
        create: client,
        update: {},
      });
      await prisma.clientMember.upsert({
        where: { clientId_userId: { clientId: saved.id, userId: admin.id } },
        create: { clientId: saved.id, userId: admin.id },
        update: {},
      });
      for (const [index, name] of categories.entries()) {
        await prisma.timeCategory.upsert({
          where: { clientId_name: { clientId: saved.id, name } },
          create: { clientId: saved.id, name, sortOrder: index + 1 },
          update: {},
        });
      }
    }
    process.stdout.write(`Seeded admin ${email} and ${SEED_CLIENTS.length} clients.\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`Seed failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
