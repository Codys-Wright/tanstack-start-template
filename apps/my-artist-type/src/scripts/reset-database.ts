import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Logger from 'effect/Logger';
import * as BunContext from '@effect/platform-bun/BunContext';
import * as SqlClient from '@effect/sql/SqlClient';
import { PgLive } from '../../../../packages/core/src/database/pg-live.js';

const resetDatabase = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  yield* Effect.log('[ResetDatabase] Dropping all tables...');

  // Drop tables in reverse dependency order
  yield* sql`DROP TABLE IF EXISTS public.todos CASCADE`;
  yield* sql`DROP TABLE IF EXISTS public.effect_sql_migrations CASCADE`;

  // Drop Better Auth tables
  yield* sql`DROP TABLE IF EXISTS public.passkey CASCADE`;
  yield* sql`DROP TABLE IF EXISTS public.two_factor CASCADE`;
  yield* sql`DROP TABLE IF EXISTS public.invitation CASCADE`;
  yield* sql`DROP TABLE IF EXISTS public.member CASCADE`;
  yield* sql`DROP TABLE IF EXISTS public.organization CASCADE`;
  yield* sql`DROP TABLE IF EXISTS public.verification CASCADE`;
  yield* sql`DROP TABLE IF EXISTS public.session CASCADE`;
  yield* sql`DROP TABLE IF EXISTS public.account CASCADE`;
  yield* sql`DROP TABLE IF EXISTS public.user CASCADE`;

  yield* Effect.log('[ResetDatabase] All tables dropped.');
  yield* Effect.log('[ResetDatabase] Run `bun run db:migrate` to recreate tables.');
});

await Effect.runPromise(
  resetDatabase.pipe(
    Effect.provide(Layer.merge(PgLive, BunContext.layer)),
    Effect.provide(Logger.pretty),
    Effect.tapError((error) => Effect.logError(`[ResetDatabase] Failed: ${error}`)),
    Effect.orDie,
  ),
);
