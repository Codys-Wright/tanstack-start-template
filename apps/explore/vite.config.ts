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
      injectSource: {
        enabled: false,
      },
      eventBusConfig: {
        port: 42070, // Different port from my-artist-type (42069)
      },
    }),
    nitro(),
    viteTsConfigPaths({
      root: '../..',
    }),
    tailwindcss(),
    tanstackStart({}),
    viteReact(),
  ],
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
