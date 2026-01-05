import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    // Use root to ensure tsconfig.base.json paths are used from monorepo root
    tsconfigPaths({ root: __dirname }),
  ],
  resolve: {
    alias: [
      // Package-specific exports first (more specific patterns)
      {
        find: '@core/database',
        replacement: resolve(__dirname, 'packages/core/src/database.ts'),
      },
      {
        find: '@core/server',
        replacement: resolve(__dirname, 'packages/core/src/server.ts'),
      },
      {
        find: '@core/client',
        replacement: resolve(__dirname, 'packages/core/src/client/index.ts'),
      },
      {
        find: /^@core\/(.*)$/,
        replacement: resolve(__dirname, 'packages/core/src/$1'),
      },
      {
        find: '@core',
        replacement: resolve(__dirname, 'packages/core/src/index.ts'),
      },
      {
        find: '@auth/database',
        replacement: resolve(__dirname, 'packages/auth/src/database.ts'),
      },
      {
        find: '@auth/server',
        replacement: resolve(__dirname, 'packages/auth/src/server.ts'),
      },
      {
        find: /^@auth\/(.*)$/,
        replacement: resolve(__dirname, 'packages/auth/src/$1'),
      },
      {
        find: '@auth',
        replacement: resolve(__dirname, 'packages/auth/src/index.ts'),
      },
      {
        find: '@example/database',
        replacement: resolve(__dirname, 'packages/example/src/database.ts'),
      },
      {
        find: '@example/server',
        replacement: resolve(__dirname, 'packages/example/src/server.ts'),
      },
      {
        find: /^@example\/(.*)$/,
        replacement: resolve(__dirname, 'packages/example/src/$1'),
      },
      {
        find: '@example',
        replacement: resolve(__dirname, 'packages/example/src/index.ts'),
      },
      {
        find: '@todo/database',
        replacement: resolve(__dirname, 'packages/todo/src/database.ts'),
      },
      {
        find: '@todo/server',
        replacement: resolve(__dirname, 'packages/todo/src/server.ts'),
      },
      {
        find: /^@todo\/(.*)$/,
        replacement: resolve(__dirname, 'packages/todo/src/$1'),
      },
      {
        find: '@todo',
        replacement: resolve(__dirname, 'packages/todo/src/index.ts'),
      },
      {
        find: '@quiz/database',
        replacement: resolve(__dirname, 'packages/quiz/src/database.ts'),
      },
      {
        find: '@quiz/server',
        replacement: resolve(__dirname, 'packages/quiz/src/server.ts'),
      },
      {
        find: /^@quiz\/(.*)$/,
        replacement: resolve(__dirname, 'packages/quiz/src/$1'),
      },
      {
        find: '@quiz',
        replacement: resolve(__dirname, 'packages/quiz/src/index.ts'),
      },
      {
        find: /^@shadcn\/(.*)$/,
        replacement: resolve(__dirname, 'packages/ui/shadcn/src/$1'),
      },
      {
        find: '@shadcn',
        replacement: resolve(__dirname, 'packages/ui/shadcn/src/index.ts'),
      },
      {
        find: /^@email\/(.*)$/,
        replacement: resolve(__dirname, 'packages/email/src/$1'),
      },
      {
        find: '@email',
        replacement: resolve(__dirname, 'packages/email/src/index.ts'),
      },
    ],
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'packages/**/*.test.{ts,tsx}', 'apps/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/reference/**'],
    environment: 'node',
    globals: true,
  },
});
