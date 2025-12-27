import * as NodeContext from "@effect/platform-node/NodeContext";
import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as PgMigrator from "@effect/sql-pg/PgMigrator";
import * as Effect from "effect/Effect";
import { PgLive } from "../pg-live.js";
import { fromFeatures } from "./feature-migration-loader.js";

/**
 * Migration runner that discovers and runs migrations from all features.
 *
 * Migrations are discovered from:
 * - src/features/auth/database/migrations/
 * - src/features/todo/database/migrations/
 * - ... any other feature with a database/migrations folder
 *
 * Migrations run in order:
 * 1. Auth migrations (always first)
 * 2. Other features (alphabetically)
 */
const program = Effect.gen(function* () {
  yield* Effect.log("Discovering feature migrations...");

  const migrations = yield* PgMigrator.run({
    loader: fromFeatures(),
  });

  if (migrations.length === 0) {
    yield* Effect.log("No new migrations to run.");
  } else {
    yield* Effect.log(`Applied ${migrations.length} migration(s):`);
    for (const [id, name] of migrations) {
      yield* Effect.log(`- ${id.toString().padStart(4, "0")}_${name}`);
    }
  }
}).pipe(Effect.provide([PgLive, NodeContext.layer]));

NodeRuntime.runMain(program);
