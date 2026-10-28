import path from 'node:path';
import { defineConfig } from 'vitest/config';

const TEST_ENV = {
  LOG_LEVEL: 'silent',
  AUTH_SECRET: 'test-secret-that-is-at-least-thirty-two-characters',
  SECRETS_ENCRYPTION_KEY: 'WiNJQz+9e2ioleHMROihPmUiBTD2jjMVkhdvWHkuJAM=',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  DATABASE_URL:
    process.env.TEST_DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:54341/codeacme_tools_test',
};

const sharedResolve = {
  alias: {
    '@': path.resolve(import.meta.dirname, 'src'),
    // `server-only` throws outside the React server runtime; tests exercise server code directly.
    'server-only': path.resolve(import.meta.dirname, 'src/test/empty-module.ts'),
  },
};

export default defineConfig({
  test: {
    projects: [
      {
        resolve: sharedResolve,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.integration.test.ts'],
          env: TEST_ENV,
        },
      },
      {
        resolve: sharedResolve,
        test: {
          name: 'integration',
          environment: 'node',
          include: ['src/**/*.integration.test.ts'],
          globalSetup: ['src/test/global-setup.ts'],
          setupFiles: ['src/test/integration-setup.ts'],
          env: TEST_ENV,
          // Integration suites share one Postgres database, so files run one at a time.
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 120_000,
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**', 'src/server/**'],
    },
  },
});
