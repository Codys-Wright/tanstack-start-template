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
    // this is the plugin that enables path aliases from tsconfig.base.json
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
