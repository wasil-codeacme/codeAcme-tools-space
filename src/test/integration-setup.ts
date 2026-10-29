import { afterAll, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';

// Services touch Next.js request APIs only through these modules; tests drive them directly.
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  connection: () => Promise.resolve(),
}));

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE "InvoiceLine", "Invoice", "InvoiceSequence", "PaymentProfile", "Project", "WorkSession", "AccountAuditEvent", "Account", "TimeEntry", "TimeCategory", "ClientMember", "Client", "User" CASCADE`;
});

afterAll(async () => {
  await prisma.$disconnect();
});
