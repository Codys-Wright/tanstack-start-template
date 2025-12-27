/// <reference types='vitest' />
import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { nodeExternals } from "rollup-plugin-node-externals";
import * as path from "path";

// Wrapper to make rollup-plugin-node-externals compatible with Vite
function externals(): Plugin {
  return {
    ...nodeExternals({
      // Automatically externalize Node.js built-ins and dependencies
      builtins: true,
      deps: true,
      devDeps: false,
      peerDeps: true,
      optDeps: true,
    }),
    name: "node-externals",
    enforce: "pre", // Run before Vite's default dependency resolution
    apply: "build",
  };
}

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: "../../node_modules/.vite/packages/auth",
  plugins: [
    externals(),
    react(),
    dts({
      entryRoot: "src",
      tsconfigPath: path.join(import.meta.dirname, "tsconfig.lib.json"),
    }),
  ],
  build: {
    outDir: "./dist",
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      entry: "src/index.ts",
      name: "@auth",
      fileName: "index",
      formats: ["es" as const],
    },
    rollupOptions: {
      // Node externals plugin will handle most of this automatically,
      // but we explicitly list these for clarity
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@shadcn",
        "@theme",
        "@core",
      ],
    },
  },
  resolve: {
    // Use Node.js module resolution instead of browser
    mainFields: ["module", "jsnext:main", "jsnext"],
    conditions: ["node"],
  },
}));
