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
    devtools(),
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
    alias: {
      // Package subpath aliases for Vite/Nitro SSR resolution
      '@auth/server': path.resolve(import.meta.dirname, '../../packages/auth/src/server.ts'),
      '@auth/database': path.resolve(import.meta.dirname, '../../packages/auth/src/database.ts'),
      '@core/database': path.resolve(import.meta.dirname, '../../packages/core/src/database.ts'),
      '@core/server': path.resolve(import.meta.dirname, '../../packages/core/src/server.ts'),
      '@example/server': path.resolve(import.meta.dirname, '../../packages/example/src/server.ts'),
      '@todo/server': path.resolve(import.meta.dirname, '../../packages/todo/src/server/index.ts'),
      '@todo/database': path.resolve(
        import.meta.dirname,
        '../../packages/todo/src/database/index.ts',
      ),
    },
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
