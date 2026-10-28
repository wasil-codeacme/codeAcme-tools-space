// Runs a real PostgreSQL locally (no Docker) for development.
// Usage: pnpm db:local   (Ctrl+C to stop)
import { existsSync } from 'node:fs';
import path from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';

const DATA_DIR = path.resolve('.data/postgres');
const PORT = Number(process.env.LOCAL_PG_PORT ?? 54340);
const DATABASES = ['codeacme_tools_dev'];

const server = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: 'postgres',
  password: 'postgres',
  port: PORT,
  persistent: true,
  onLog: () => {},
});

const isFresh = !existsSync(path.join(DATA_DIR, 'PG_VERSION'));
if (isFresh) {
  await server.initialise();
}
await server.start();
for (const database of DATABASES) {
  try {
    await server.createDatabase(database);
  } catch {
    // The database already exists from a previous run.
  }
}
process.stdout.write(
  `Postgres ready on postgresql://postgres:postgres@localhost:${PORT} (dbs: ${DATABASES.join(', ')})\n`,
);

const shutdown = async () => {
  await server.stop();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
setInterval(() => {}, 1 << 30);
