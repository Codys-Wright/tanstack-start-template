import type * as PgMigrator from "@effect/sql-pg/PgMigrator";
import * as Effect from "effect/Effect";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { readdir } from "node:fs/promises";

/**
 * Custom migration loader that discovers migrations from all features.
 *
 * Each feature can have its own migrations in:
 * src/features/{feature}/database/migrations/
 *
 * Migrations are loaded in order:
 * 1. Auth migrations (0001_*, 0002_*, etc.)
 * 2. Todo migrations (0001_*, 0002_*, etc.)
 * 3. Other feature migrations...
 *
 * Global ordering is: {feature}_{migrationId}
 * Example: auth_0001, auth_0002, todo_0001
 */

interface MigrationFile {
  readonly feature: string;
  readonly id: number;
  readonly name: string;
  readonly path: string;
}

const FEATURES_DIR = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../../" // Go up to features/ directory
);

/**
 * Discover all migration directories across features
 */
const discoverMigrationDirs = Effect.tryPromise({
  try: async () => {
    const features = await readdir(FEATURES_DIR, { withFileTypes: true });
    const migrationDirs: Array<{ feature: string; path: string }> = [];

    for (const feature of features) {
      if (!feature.isDirectory()) continue;

      const migrationPath = path.join(
        FEATURES_DIR,
        feature.name,
        "database/migrations"
      );

      try {
        await readdir(migrationPath);
        migrationDirs.push({
          feature: feature.name,
          path: migrationPath,
        });
      } catch {
        // Feature doesn't have migrations, skip
      }
    }

    return migrationDirs;
  },
  catch: (error) =>
    new Error(`Failed to discover migration directories: ${error}`),
});

/**
 * Load migrations from a specific feature
 */
const loadFeatureMigrations = (
  feature: string,
  migrationPath: string
): Effect.Effect<readonly MigrationFile[], Error> =>
  Effect.tryPromise({
    try: async () => {
      const files = await readdir(migrationPath);
      const migrations: MigrationFile[] = [];

      for (const file of files) {
        if (!file.endsWith(".ts") || file.endsWith(".test.ts")) continue;

        // Parse migration filename: 0001_description.ts
        const match = file.match(/^(\d+)_(.+)\.ts$/);
        if (!match) continue;

        const [, idStr, name] = match;
        const id = Number.parseInt(idStr, 10);

        migrations.push({
          feature,
          id,
          name,
          path: path.join(migrationPath, file),
        });
      }

      return migrations.sort((a, b) => a.id - b.id);
    },
    catch: (error) =>
      new Error(`Failed to load migrations from ${feature}: ${error}`),
  });

/**
 * Create a PgMigrator loader from feature migrations
 */
export const fromFeatures = (): PgMigrator.Loader =>
  Effect.gen(function* () {
    // Discover all migration directories
    const migrationDirs = yield* discoverMigrationDirs;

    // Load migrations from each feature
    const allMigrations = yield* Effect.all(
      migrationDirs.map(({ feature, path }) =>
        loadFeatureMigrations(feature, path)
      )
    );

    // Flatten and sort: auth migrations first, then others alphabetically by feature
    const sortedMigrations = allMigrations.flat().sort((a, b) => {
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

    // Import each migration and create the loader result
    const migrations = yield* Effect.all(
      sortedMigrations.map((migration, globalIndex) => {
        // Global ID is based on sorted order
        const globalId = globalIndex + 1;

        // Name includes feature prefix for clarity
        const globalName = `${migration.feature}_${migration.name}`;

        // Lazy load the migration
        const load = Effect.promise(() => import(migration.path)).pipe(
          Effect.map((module) => module.default)
        );

        return Effect.succeed([globalId, globalName, load] as const);
      })
    );

    return migrations;
  }).pipe(Effect.orDie);
