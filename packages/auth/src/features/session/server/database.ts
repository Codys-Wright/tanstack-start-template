import * as Effect from 'effect/Effect';
import * as Redacted from 'effect/Redacted';
import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import { AuthConfig } from './config';

const { Pool } = pg;

const makeKysely = Effect.acquireRelease(
  Effect.gen(function* () {
    const env = yield* AuthConfig;
    const connectionString = Redacted.value(env.DATABASE_URL);

    const pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });

    const dialect = new PostgresDialect({ pool });
    const kysely = new Kysely({ dialect });

    return { kysely, pool } as const;
  }),
  ({ kysely }) =>
    Effect.promise(async () => {
      await kysely.destroy();
    }),
).pipe(Effect.map(({ kysely }) => kysely));

export class AuthDatabase extends Effect.Service<AuthDatabase>()('AuthDatabase', {
  scoped: makeKysely,
  dependencies: [AuthConfig.Default],
}) {}
