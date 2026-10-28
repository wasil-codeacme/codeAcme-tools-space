// Copies one client's real data from one database to another (e.g. local → production):
// the client, its categories, its time entries and its accounts' non-secret details.
// Passwords and secure notes are never copied: they are encrypted with each environment's own key.
//
// Usage (dry run prints what would change; add --apply to write):
//   SOURCE_DATABASE_URL=… TARGET_DATABASE_URL=… CLIENT_SLUG=the-30k-club \
//   pnpm exec tsx scripts/copy-client-data.ts [--apply]
//
// Safe to re-run: existing categories, entries and accounts in the target are matched and skipped.
import { existsSync, readFileSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { parse } from 'dotenv';
import { z } from 'zod';
import { PrismaClient } from '@/generated/prisma/client';
import { AccountAuditAction } from '@/generated/prisma/enums';

const envSchema = z.object({
  SOURCE_DATABASE_URL: z.url(),
  TARGET_DATABASE_URL: z.url(),
  CLIENT_SLUG: z.string().min(1).default('the-30k-club'),
  TARGET_OWNER_EMAIL: z.email(),
});

const APPLY_FLAG = '--apply';
// A remote database adds latency to every statement; Prisma's 5s transaction default is too tight.
const TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 60_000 };
const SOURCE_ENV_FILE = '.env';
const TARGET_ENV_FILE = '.env.production.local';

function readEnvFile(path: string): Record<string, string> {
  return existsSync(path) ? parse(readFileSync(path)) : {};
}

// Each URL comes from its own file, so a production file can never end up as the source.
function loadConfig() {
  const sourceFile = readEnvFile(SOURCE_ENV_FILE);
  const targetFile = readEnvFile(TARGET_ENV_FILE);
  // `||` so the empty placeholders in the file count as "not set" and fail validation clearly.
  const config = envSchema.parse({
    ...process.env,
    SOURCE_DATABASE_URL: process.env.SOURCE_DATABASE_URL || sourceFile.DATABASE_URL,
    TARGET_DATABASE_URL:
      process.env.TARGET_DATABASE_URL || targetFile.TARGET_DATABASE_URL || targetFile.DATABASE_URL,
    TARGET_OWNER_EMAIL: process.env.TARGET_OWNER_EMAIL || targetFile.TARGET_OWNER_EMAIL,
  });
  if (config.SOURCE_DATABASE_URL === config.TARGET_DATABASE_URL) {
    throw new Error('Source and target are the same database; refusing to copy.');
  }
  return config;
}

function connect(url: string) {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

function entryKey(entry: { workDate: Date; durationMinutes: number; task: string }) {
  return `${entry.workDate.toISOString().slice(0, 10)}|${entry.durationMinutes}|${entry.task.trim().toLowerCase()}`;
}

function accountKey(account: { name: string; username: string | null }) {
  return `${account.name.trim().toLowerCase()}|${(account.username ?? '').trim().toLowerCase()}`;
}

async function main() {
  const config = loadConfig();
  const apply = process.argv.includes(APPLY_FLAG);
  const source = connect(config.SOURCE_DATABASE_URL);
  const target = connect(config.TARGET_DATABASE_URL);

  try {
    const client = await source.client.findUniqueOrThrow({
      where: { slug: config.CLIENT_SLUG },
      include: {
        categories: true,
        timeEntries: { include: { category: true } },
        accounts: { where: { isArchived: false } },
      },
    });
    const owner = await target.user.findUnique({
      where: { email: config.TARGET_OWNER_EMAIL.toLowerCase() },
    });
    if (!owner) {
      throw new Error(
        `No user ${config.TARGET_OWNER_EMAIL} in the target. Run the seed there first.`,
      );
    }

    // Exact duplicates in the source (same day, duration and task) are copied once.
    const uniqueEntries = [
      ...new Map(client.timeEntries.map((entry) => [entryKey(entry), entry])).values(),
    ];
    const existingClient = await target.client.findUnique({
      where: { slug: client.slug },
      include: { categories: true, timeEntries: true, accounts: true },
    });
    const existingEntryKeys = new Set((existingClient?.timeEntries ?? []).map(entryKey));
    const existingAccountKeys = new Set((existingClient?.accounts ?? []).map(accountKey));
    const existingCategoryNames = new Set(
      (existingClient?.categories ?? []).map((category) => category.name),
    );

    const newCategories = client.categories.filter(
      (category) => !existingCategoryNames.has(category.name),
    );
    const newEntries = uniqueEntries.filter((entry) => !existingEntryKeys.has(entryKey(entry)));
    const newAccounts = client.accounts.filter(
      (account) => !existingAccountKeys.has(accountKey(account)),
    );

    process.stdout.write(
      [
        `Client: ${client.name} (${existingClient ? 'exists in target' : 'will be created'})`,
        `Categories to add: ${newCategories.length}`,
        `Time entries to add: ${newEntries.length} (source ${client.timeEntries.length}, ${client.timeEntries.length - uniqueEntries.length} exact duplicates skipped, ${uniqueEntries.length - newEntries.length} already in target)`,
        `Accounts to add: ${newAccounts.length} (secrets not copied)`,
        `Owner in target: ${owner.email}`,
        apply ? 'Applying…' : `Dry run only. Re-run with ${APPLY_FLAG} to write.`,
        '',
      ].join('\n'),
    );
    if (!apply) {
      return;
    }

    await target.$transaction(async (transaction) => {
      const targetClient =
        existingClient ??
        (await transaction.client.create({
          data: {
            name: client.name,
            slug: client.slug,
            contactName: client.contactName,
            monthlyLimitMinutes: client.monthlyLimitMinutes,
          },
        }));
      await transaction.clientMember.upsert({
        where: { clientId_userId: { clientId: targetClient.id, userId: owner.id } },
        create: { clientId: targetClient.id, userId: owner.id },
        update: {},
      });
      for (const category of newCategories) {
        await transaction.timeCategory.create({
          data: {
            clientId: targetClient.id,
            name: category.name,
            sortOrder: category.sortOrder,
            isArchived: category.isArchived,
          },
        });
      }
      const targetCategories = await transaction.timeCategory.findMany({
        where: { clientId: targetClient.id },
      });
      const categoryIdByName = new Map(
        targetCategories.map((category) => [category.name, category.id]),
      );
      await transaction.timeEntry.createMany({
        data: newEntries.map((entry) => ({
          clientId: targetClient.id,
          userId: owner.id,
          categoryId: entry.category ? (categoryIdByName.get(entry.category.name) ?? null) : null,
          workDate: entry.workDate,
          durationMinutes: entry.durationMinutes,
          task: entry.task,
          requestedBy: entry.requestedBy,
          link: entry.link,
          needsReview: entry.needsReview,
        })),
      });
      const createdAccounts = await transaction.account.createManyAndReturn({
        data: newAccounts.map((account) => ({
          clientId: targetClient.id,
          name: account.name,
          purpose: account.purpose,
          accessLevel: account.accessLevel,
          url: account.url,
          username: account.username,
          twoFactor: account.twoFactor,
          notes: account.notes,
          updatedById: owner.id,
        })),
        select: { id: true },
      });
      await transaction.accountAuditEvent.createMany({
        data: createdAccounts.map((account) => ({
          accountId: account.id,
          userId: owner.id,
          action: AccountAuditAction.CREATED,
        })),
      });
    }, TRANSACTION_OPTIONS);
    process.stdout.write('Done.\n');
  } finally {
    await Promise.all([source.$disconnect(), target.$disconnect()]);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`Copy failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
