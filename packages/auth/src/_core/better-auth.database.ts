import * as Effect from "effect/Effect";
import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { BetterAuthConfig, getDatabaseUrl } from "./better-auth.config.js";

const { Pool } = pg;

const makeKysely = Effect.acquireRelease(
  Effect.gen(function* () {
    const env = yield* BetterAuthConfig;
    const connectionString = getDatabaseUrl(env);

    const pool = new Pool({
      connectionString,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : undefined,
    });

    const dialect = new PostgresDialect({ pool });
    const kysely = new Kysely({ dialect });

    return { kysely, pool } as const;
  }),
  ({ kysely }) =>
    Effect.promise(async () => {
      await kysely.destroy();
    })
).pipe(Effect.map(({ kysely }) => kysely));

export class BetterAuthDatabase extends Effect.Service<BetterAuthDatabase>()(
  "BetterAuthDatabase",
  {
    scoped: makeKysely,
    dependencies: [BetterAuthConfig.Default],
  }
) {}
