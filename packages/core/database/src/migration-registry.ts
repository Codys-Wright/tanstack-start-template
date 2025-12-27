import type * as PgMigrator from "@effect/sql-pg/PgMigrator";
import * as Effect from "effect/Effect";

/**
 * A single migration definition
 */
export interface Migration {
  readonly id: number;
  readonly name: string;
  readonly run: Effect.Effect<void, unknown, unknown>;
}

/**
 * A feature's migration loader
 * Each package can export its own migrations
 */
export interface FeatureMigrations {
  readonly feature: string;
  readonly migrations: ReadonlyArray<Migration>;
}

/**
 * Migration registry configuration
 * The app provides all enabled feature migrations
 */
export interface MigrationRegistryConfig {
  readonly features: ReadonlyArray<FeatureMigrations>;
}

/**
 * Create a PgMigrator loader from explicitly registered feature migrations.
 * 
 * This is type-safe and doesn't rely on file system discovery.
 * Each package exports its migrations, and the app registers them.
 * 
 * @example
 * ```ts
 * import { authMigrations } from "@auth";
 * import { todoMigrations } from "@todo";
 * 
 * const loader = createMigrationLoader({
 *   features: [authMigrations, todoMigrations]
 * });
 * ```
 */
export const createMigrationLoader = (
  config: MigrationRegistryConfig
): PgMigrator.Loader =>
  Effect.gen(function* () {
    // Flatten all migrations from all features
    const allMigrations = config.features.flatMap((feature) =>
      feature.migrations.map((migration) => ({
        ...migration,
        feature: feature.feature,
      }))
    );

    // Sort migrations: by feature name, then by ID within feature
    const sortedMigrations = allMigrations.sort((a, b) => {
      // Auth migrations come first
      if (a.feature === "auth" && b.feature !== "auth") return -1;
      if (a.feature !== "auth" && b.feature === "auth") return 1;

      // Then sort by feature name
      if (a.feature !== b.feature) {
        return a.feature.localeCompare(b.feature);
      }

      // Within same feature, sort by ID
      return a.id - b.id;
    });

    // Create PgMigrator loader format: [globalId, globalName, load]
    return sortedMigrations.map((migration, index) => {
      const globalId = index + 1;
      const globalName = `${migration.feature}_${migration.name}`;
      const load = Effect.succeed(migration.run);

      return [globalId, globalName, load] as const;
    });
  }).pipe(Effect.orDie);

/**
 * Helper to define migrations for a feature.
 * Provides better type safety and IDE autocomplete.
 * 
 * @example
 * ```ts
 * export const authMigrations = defineFeatureMigrations("auth", [
 *   {
 *     id: 1,
 *     name: "users_table",
 *     run: Effect.gen(function* () {
 *       const sql = yield* SqlClient.SqlClient;
 *       yield* sql`CREATE TABLE users (...)`;
 *     })
 *   }
 * ]);
 * ```
 */
export const defineFeatureMigrations = (
  feature: string,
  migrations: ReadonlyArray<Migration>
): FeatureMigrations => ({
  feature,
  migrations,
});
