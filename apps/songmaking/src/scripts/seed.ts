/**
 * Database Seeding Script for Songmaking
 *
 * Seeds the database with data for development and testing.
 * Uses composable seeders from feature packages.
 *
 * Usage:
 *   bun run db:seed                    # Seed with all data (users, orgs)
 *   bun run db:seed --cleanup          # Remove all fake data
 *   bun run db:seed --minimal          # Minimal seed (dev admin only)
 */

import * as Effect from 'effect/Effect';
import * as Logger from 'effect/Logger';

import { auth, authCleanup } from '@auth/database';
import { runCleanup, runSeed } from '@core/database';

const isCleanup = process.argv.includes('--cleanup');
const isMinimal = process.argv.includes('--minimal');

if (isCleanup) {
  // Cleanup mode: remove all fake data
  await Effect.runPromise(runCleanup(...authCleanup()).pipe(Effect.provide(Logger.pretty)));
} else if (isMinimal) {
  // Minimal mode: just dev admin
  await Effect.runPromise(
    runSeed(...auth({ devAdmin: true, users: 0, organizations: 0 })).pipe(
      Effect.provide(Logger.pretty),
    ),
  );
} else {
  // Default seed mode: dev admin + users + organizations
  await Effect.runPromise(
    runSeed(...auth({ users: 20, organizations: 5 })).pipe(Effect.provide(Logger.pretty)),
  );
}
