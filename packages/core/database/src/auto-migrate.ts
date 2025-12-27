import * as PgMigrator from "@effect/sql-pg/PgMigrator";
import * as Effect from "effect/Effect";
import { PgLive } from "./pg-live.js";
import type { MigrationRegistryConfig } from "./migration-registry.js";
import { createMigrationLoader } from "./migration-registry.js";

/**
 * Run database migrations with the provided configuration.
 * 
 * @param config - Migration registry config with all enabled features
 * 
 * @example
 * ```ts
 * import { authMigrations } from "@auth";
 * 
 * const migrations = runAutoMigration({
 *   features: [authMigrations]
 * });
 * ```
 */
export const runAutoMigration = (config: MigrationRegistryConfig) =>
  Effect.gen(function* () {
    yield* Effect.log("[AutoMigration] Starting database migration check...");

    const migrations = yield* PgMigrator.run({
      loader: createMigrationLoader(config),
    });

    if (migrations.length === 0) {
      yield* Effect.log("[AutoMigration] No new migrations to apply.");
    } else {
      yield* Effect.log(
        `[AutoMigration] Applied ${migrations.length} migration(s):`
      );
      for (const [id, name] of migrations) {
        yield* Effect.log(`  - ${id.toString().padStart(4, "0")}_${name}`);
      }
    }

    yield* Effect.log("[AutoMigration] Database schema is up-to-date.");
  }).pipe(
    Effect.provide(PgLive),
    Effect.tapError((error) =>
      Effect.logError(`[AutoMigration] Migration failed: ${error}`)
    ),
    Effect.orDie
  );

/**
 * AutoMigration Service
 *
 * Automatically runs database migrations on application startup.
 * 
 * @example
 * ```ts
 * import { authMigrations } from "@auth";
 * 
 * const AutoMigrationLive = makeAutoMigration({
 *   features: [authMigrations]
 * });
 * 
 * // Include in your server layer
 * const ServerLive = Layer.mergeAll(
 *   PgLive,
 *   AutoMigrationLive,
 *   // ... other layers
 * );
 * ```
 */
export const makeAutoMigration = (config: MigrationRegistryConfig) =>
  Effect.Service<AutoMigration>()(
    "AutoMigration",
    {
      scoped: Effect.gen(function* () {
        yield* runAutoMigration(config);

        // Return a marker object to satisfy the service signature
        return {
          _tag: "AutoMigration" as const,
        } as const;
      }),
      dependencies: [],
    }
  );

// Type for the AutoMigration service
export type AutoMigration = {
  readonly _tag: "AutoMigration";
};
