import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import viteReact from '@vitejs/plugin-react'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'

const __dirname = dirname(fileURLToPath(import.meta.url))

const config = defineConfig({
  root: __dirname,
  plugins: [
    devtools(),
    nitro(),
    viteTsConfigPaths({
      projects: [resolve(__dirname, './tsconfig.json')],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  optimizeDeps: {
    exclude: ['cpu-features', 'pg'],
  },
  ssr: {
    external: ['cpu-features', 'pg'],
    noExternal: [],
  },
})

export default config
