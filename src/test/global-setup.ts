import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';

const TEST_PORT = 54341;
const TEST_DATABASE = 'codeacme_tools_test';

// Boots a throwaway PostgreSQL and applies the real migrations, so integration tests exercise the
// same schema production runs. Set TEST_DATABASE_URL to reuse an existing database instead.
export default async function setup() {
  const existingUrl = process.env.TEST_DATABASE_URL;
  if (existingUrl) {
    migrate(existingUrl);
    return () => undefined;
  }

  const dataDir = mkdtempSync(path.join(tmpdir(), 'codeacme-tools-test-pg-'));
  const server = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'postgres',
    password: 'postgres',
    port: TEST_PORT,
    persistent: false,
    onLog: () => {},
  });
  await server.initialise();
  await server.start();
  await server.createDatabase(TEST_DATABASE);
  migrate(`postgresql://postgres:postgres@localhost:${TEST_PORT}/${TEST_DATABASE}`);

  return async () => {
    await server.stop();
    rmSync(dataDir, { recursive: true, force: true });
  };
}

function migrate(url: string) {
  execSync('pnpm exec prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: url, DATABASE_URL_UNPOOLED: url },
    stdio: 'ignore',
  });
}
