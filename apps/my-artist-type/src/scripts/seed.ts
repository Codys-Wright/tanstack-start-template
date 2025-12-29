/**
 * Database Seeding Script
 *
 * Seeds the database with fake data for development and testing.
 * Uses composable seeders from feature packages.
 *
 * Usage:
 *   bun run db:seed           # Seed with defaults
 *   bun run db:seed:cleanup   # Remove all fake data
 */

import * as Effect from 'effect/Effect';
import * as Logger from 'effect/Logger';

import { auth, authCleanup } from '@auth/database';
import { runCleanup, runSeed } from '@core/database';
import { example, exampleCleanup } from '@example/database';
import { todo, todoCleanup } from '@todo/database';

const isCleanup = process.argv.includes('--cleanup');

if (isCleanup) {
  // Cleanup mode: remove all fake data
  await Effect.runPromise(
    runCleanup(...exampleCleanup(), ...todoCleanup(), ...authCleanup()).pipe(
      Effect.provide(Logger.pretty),
    ),
  );
} else {
  // Seed mode: create fake data
  await Effect.runPromise(
    runSeed(
      ...auth({ users: 50, organizations: 10 }),
      ...todo({ todos: 100 }),
      ...example({ features: 20 }),
    ).pipe(Effect.provide(Logger.pretty)),
  );
}
