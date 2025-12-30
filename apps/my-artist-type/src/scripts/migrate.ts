import * as Effect from 'effect/Effect';
import * as Logger from 'effect/Logger';

import { AuthMigrations, runBetterAuthMigrations } from '@auth/database';
import { runMigrations } from '@core/database';
import { ExampleMigrations } from '@example/database';
import { QuizMigrations } from '@quiz/database';
import { TodoMigrations } from '@todo/database';

// Run Better Auth migrations first (creates user, session, etc. tables)
// Then run our custom migrations (AuthMigrations + TodoMigrations + ExampleMigrations + QuizMigrations)
await Effect.runPromise(
  Effect.gen(function* () {
    // Better Auth handles its own migrations via Kysely
    yield* runBetterAuthMigrations;

    // Run our Effect SQL migrations
    yield* runMigrations(AuthMigrations, TodoMigrations, ExampleMigrations, QuizMigrations);
  }).pipe(Effect.provide(Logger.pretty)),
);
