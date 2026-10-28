import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,

  {
    rules: {
      'id-length': ['error', { min: 2, properties: 'never', exceptionPatterns: ['^_$'] }],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // Repository pattern: only repositories may touch the database client.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/lib/prisma',
              message:
                'Import Prisma only inside src/server/repositories/**. Services depend on repositories.',
            },
          ],
          patterns: [
            {
              group: ['@/generated/prisma/client'],
              message:
                'Import the Prisma client only inside src/server/repositories/** or src/lib/prisma.ts.',
            },
          ],
        },
      ],
    },
  },

  {
    files: [
      'src/server/repositories/**/*.ts',
      'src/lib/prisma.ts',
      'prisma/**/*.ts',
      'scripts/**/*.ts',
      'src/test/**/*.ts',
      'src/**/*.integration.test.ts',
    ],
    rules: { 'no-restricted-imports': 'off' },
  },

  // shadcn/ui primitives are generated vendor code; we own them but keep them close to upstream.
  {
    files: ['src/components/ui/**/*.tsx', 'src/hooks/use-mobile.ts'],
    rules: { 'id-length': 'off' },
  },

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'next-env.d.ts',
    'src/generated/**',
    'playwright-report/**',
    'test-results/**',
    '.data/**',
  ]),
]);

export default eslintConfig;
