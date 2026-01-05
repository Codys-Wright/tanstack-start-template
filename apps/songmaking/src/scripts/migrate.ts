/**
 * Database Migration Script for Songmaking
 *
 * Runs all database migrations in order:
 * 1. Better Auth migrations (user, session, account tables)
 * 2. Any additional app-specific migrations (if added later)
 *
 * Note: Better Auth manages its own table schema. The AuthMigrations from
 * @auth/database are for testing purposes and should NOT be run when
 * Better Auth is handling the schema.
 *
 * Usage:
 *   bun run db:migrate
 */

import * as Effect from 'effect/Effect';
import * as Logger from 'effect/Logger';

import { runBetterAuthMigrations } from '@auth/database';

// Run Better Auth migrations (creates user, session, account, etc. tables)
// Better Auth uses Kysely for migrations and handles its own schema
await Effect.runPromise(
  Effect.gen(function* () {
    yield* runBetterAuthMigrations;
    yield* Effect.log('[Migrate] Better Auth migrations complete.');
  }).pipe(Effect.provide(Logger.pretty)),
);
