import path from 'node:path';
import { defineConfig } from 'vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import { nitro } from 'nitro/vite';

const config = defineConfig({
  root: import.meta.dirname,
  plugins: [
    devtools({
      // Disable data-tsd-source attributes to prevent hydration warnings
      // These attributes embed source file locations but cause SSR/client mismatches during development
      injectSource: {
        enabled: false,
      },
    }),
    nitro(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.app.json'],
    }),
    tailwindcss(),
    tanstackStart({}),
    viteReact(),
  ],
  resolve: {
    alias: [
      // Package subpath aliases for Vite/Nitro SSR resolution
      // More specific paths MUST come before less specific ones
      {
        find: '@artist-types/server',
        replacement: path.resolve(import.meta.dirname, '../../packages/artist-types/src/server.ts'),
      },
      {
        find: '@artist-types/database',
        replacement: path.resolve(
          import.meta.dirname,
          '../../packages/artist-types/src/database.ts',
        ),
      },
      {
        find: '@artist-types',
        replacement: path.resolve(import.meta.dirname, '../../packages/artist-types/src/index.ts'),
      },
      {
        find: '@auth/server',
        replacement: path.resolve(import.meta.dirname, '../../packages/auth/src/server.ts'),
      },
      {
        find: '@auth/database',
        replacement: path.resolve(import.meta.dirname, '../../packages/auth/src/database.ts'),
      },
      {
        find: '@components',
        replacement: path.resolve(import.meta.dirname, '../../packages/ui/components/src/index.ts'),
      },
      {
        find: '@core/client/atom-utils',
        replacement: path.resolve(
          import.meta.dirname,
          '../../packages/core/src/client/atom-utils.ts',
        ),
      },
      {
        find: '@core/client/rpc-config',
        replacement: path.resolve(
          import.meta.dirname,
          '../../packages/core/src/client/rpc-config.ts',
        ),
      },
      {
        find: '@core/client',
        replacement: path.resolve(import.meta.dirname, '../../packages/core/src/client/index.ts'),
      },
      {
        find: '@core/database',
        replacement: path.resolve(import.meta.dirname, '../../packages/core/src/database.ts'),
      },
      {
        find: '@core/server',
        replacement: path.resolve(import.meta.dirname, '../../packages/core/src/server.ts'),
      },
      {
        find: '@example/server',
        replacement: path.resolve(import.meta.dirname, '../../packages/example/src/server.ts'),
      },
      {
        find: '@todo/server',
        replacement: path.resolve(import.meta.dirname, '../../packages/todo/src/server.ts'),
      },
      {
        find: '@todo/database',
        replacement: path.resolve(import.meta.dirname, '../../packages/todo/src/database.ts'),
      },
      {
        find: '@quiz/server',
        replacement: path.resolve(import.meta.dirname, '../../packages/quiz/src/server.ts'),
      },
      {
        find: '@quiz/database',
        replacement: path.resolve(import.meta.dirname, '../../packages/quiz/src/database.ts'),
      },
    ],
  },
  optimizeDeps: {
    exclude: ['cpu-features', 'pg', '@testcontainers/postgresql'],
  },
  ssr: {
    external: ['cpu-features', 'pg', '@testcontainers/postgresql'],
    noExternal: [],
  },
  build: {
    outDir: './output',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});

export default config;
