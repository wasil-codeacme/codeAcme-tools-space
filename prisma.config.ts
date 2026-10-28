import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Migrations need a direct (unpooled) connection; Neon's Vercel integration exposes it separately.
// Tooling config lives outside src/, so it reads the environment directly rather than via src/config/env.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
  },
});
