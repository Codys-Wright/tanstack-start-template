import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}", "reference/**/*.test.{ts,tsx}"],
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shadcn": path.resolve(__dirname, "./src/features/ui/shadcn"),
      "@shadcn/*": path.resolve(__dirname, "./src/features/ui/shadcn/*"),
      "@/components/ui": path.resolve(__dirname, "./src/features/ui/shadcn/components/ui"),
      "@/components/ui/*": path.resolve(__dirname, "./src/features/ui/shadcn/components/ui/*"),
    },
  },
})