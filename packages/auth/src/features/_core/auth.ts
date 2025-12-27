import { betterAuth } from "better-auth";
import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { makeBetterAuthOptions } from "./better-auth.service";

const { Pool } = pg;

/**
 * Better Auth configuration for CLI tools (generate, migrate).
 *
 * This file is used by @better-auth/cli to generate schema files.
 * It reuses the exact same configuration from better-auth.service.ts
 * to ensure consistency between runtime and CLI tools.
 */

// Create Kysely instance for Better Auth CLI
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const dialect = new PostgresDialect({ pool });
const db = new Kysely({ dialect });

// Use the same options factory as the service
const options = makeBetterAuthOptions({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "placeholder-secret",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  db,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  appName: process.env.APP_NAME || "TanStack App",
  sendEmail: async (to, subject, _html) => {
    // Mock implementation for CLI - just log to stderr
    process.stderr.write(`[Email] To: ${to}, Subject: ${subject}\n`);
  },
});

export const auth = betterAuth(options);
