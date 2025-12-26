import * as PgMigrator from "@effect/sql-pg/PgMigrator";
import * as Effect from "effect/Effect";
import { PgLive } from "./pg-live.js";
import { fromFeatures } from "./scripts/feature-migration-loader.js";

/**
 * AutoMigration Service
 *
 * Automatically runs database migrations on application startup.
 * Discovers and applies migrations from all features in dependency order.
 *
 * Similar to Better Auth's auto-migration, this ensures the database
 * schema is always up-to-date when the application starts.
 *
 * Usage:
 * Include AutoMigration.Live in your server layer to enable auto-migration.
 */
export class AutoMigration extends Effect.Service<AutoMigration>()(
  "AutoMigration",
  {
    scoped: Effect.gen(function* () {
      yield* Effect.log("[AutoMigration] Starting database migration check...");

      const migrations = yield* PgMigrator.run({
        loader: fromFeatures(),
      });

      if (migrations.length === 0) {
        yield* Effect.log("[AutoMigration] No new migrations to apply.");
      } else {
        yield* Effect.log(
          `[AutoMigration] Applied ${migrations.length} migration(s):`,
        );
        for (const [id, name] of migrations) {
          yield* Effect.log(`  - ${id.toString().padStart(4, "0")}_${name}`);
        }
      }

      yield* Effect.log("[AutoMigration] Database schema is up-to-date.");

      // Return a marker object to satisfy the service signature
      return {
        _tag: "AutoMigration" as const,
      } as const;
    }).pipe(
      Effect.provide(PgLive),
      // Log errors but don't crash the app
      Effect.tapError((error) =>
        Effect.logError(`[AutoMigration] Migration failed: ${error}`),
      ),
      // Convert failures to defects (crash on migration errors)
      // This ensures we don't start the app with an outdated schema
      Effect.orDie,
    ),
    dependencies: [],
  },
) {}

// Export the migration logic for direct use in server initialization
export const runAutoMigration = Effect.gen(function* () {
  yield* Effect.log("[AutoMigration] Starting database migration check...");

  const migrations = yield* PgMigrator.run({
    loader: fromFeatures(),
  });

  if (migrations.length === 0) {
    yield* Effect.log("[AutoMigration] No new migrations to apply.");
  } else {
    yield* Effect.log(
      `[AutoMigration] Applied ${migrations.length} migration(s):`,
    );
    for (const [id, name] of migrations) {
      yield* Effect.log(`  - ${id.toString().padStart(4, "0")}_${name}`);
    }
  }

  yield* Effect.log("[AutoMigration] Database schema is up-to-date.");
}).pipe(
  Effect.provide(PgLive),
  Effect.tapError((error) =>
    Effect.logError(`[AutoMigration] Migration failed: ${error}`),
  ),
  Effect.orDie,
);
