import { runMigrations } from '../../../../packages/core/src/database/index.js';
import { AuthMigrations, runBetterAuthMigrations } from '../../../../packages/auth/src/database.js';
import { TodoMigrations } from '../../../../packages/todo/src/database/index.js';
import * as Effect from 'effect/Effect';
import * as Logger from 'effect/Logger';

// Run Better Auth migrations first (creates user, session, etc. tables)
// Then run our custom migrations (AuthMigrations + TodoMigrations)
await Effect.runPromise(
  Effect.gen(function* () {
    // Better Auth handles its own migrations via Kysely
    yield* runBetterAuthMigrations;

    // Run our Effect SQL migrations
    yield* runMigrations(AuthMigrations, TodoMigrations);
  }).pipe(Effect.provide(Logger.pretty)),
);
