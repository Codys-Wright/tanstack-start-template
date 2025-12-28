import { discoverFromPath } from '@core/database';
import type * as PgMigrator from '@effect/sql-pg/PgMigrator';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getMigrations } from 'better-auth/db';
import { makeBetterAuthOptions } from '../features/_core/service.js';
import { AuthDatabase } from '../features/_core/database.js';
import { AuthConfig } from '../features/_core/config.js';
import * as Redacted from 'effect/Redacted';
import * as Option from 'effect/Option';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Custom auth migrations from the migrations/ folder.
 * Use this for any auth-related schema changes beyond what Better Auth provides.
 */
export const CustomAuthMigrations = discoverFromPath({
  path: join(__dirname, 'migrations'),
  prefix: 'auth',
});

/**
 * Run Better Auth's built-in migrations.
 * Creates tables: user, session, account, verification, organization, member, invitation, passkey, twoFactor
 *
 * This requires AuthDatabase (Kysely) to be available.
 */
export const runBetterAuthMigrations = Effect.gen(function* () {
  const kysely = yield* AuthDatabase;
  const env = yield* AuthConfig;

  const options = makeBetterAuthOptions({
    baseURL: env.BETTER_AUTH_URL,
    secret: Redacted.value(env.BETTER_AUTH_SECRET),
    clientOrigin: env.CLIENT_ORIGIN,
    db: kysely,
    googleClientId: Option.isSome(env.GOOGLE_CLIENT_ID)
      ? Redacted.value(env.GOOGLE_CLIENT_ID.value)
      : undefined,
    googleClientSecret: Option.isSome(env.GOOGLE_CLIENT_SECRET)
      ? Redacted.value(env.GOOGLE_CLIENT_SECRET.value)
      : undefined,
    appName: env.APP_NAME,
    sendEmail: async () => {},
  });

  const { toBeCreated, toBeAdded, runMigrations } = yield* Effect.promise(() =>
    getMigrations(options),
  );

  const totalPending = toBeCreated.length + toBeAdded.length;

  if (totalPending > 0) {
    yield* Effect.log(
      `[BetterAuth] Running ${totalPending} migration(s): ${toBeCreated.length} tables to create, ${toBeAdded.length} columns to add`,
    );
    yield* Effect.promise(runMigrations);
    yield* Effect.log('[BetterAuth] Migrations complete.');
  } else {
    yield* Effect.log('[BetterAuth] No pending migrations.');
  }
}).pipe(Effect.provide(Layer.merge(AuthDatabase.Default, AuthConfig.Default)), Effect.scoped);

/**
 * Combined auth migrations loader.
 * Only includes custom auth migrations - Better Auth migrations are run separately via runBetterAuthMigrations.
 */
export const AuthMigrations: PgMigrator.Loader = CustomAuthMigrations;
