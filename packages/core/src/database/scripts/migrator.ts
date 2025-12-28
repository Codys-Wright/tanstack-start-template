import * as BunContext from '@effect/platform-bun/BunContext';
import * as BunRuntime from '@effect/platform-bun/BunRuntime';
import * as PgMigrator from '@effect/sql-pg/PgMigrator';
import { PgLive } from '../pg-live.js';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { join } from 'node:path';
import { readdir } from 'node:fs/promises';

interface MigrationFile {
  readonly id: number;
  readonly name: string;
  readonly path: string;
}

interface DiscoverOptions {
  /** Absolute path to the migrations directory */
  readonly path: string;
  /** Prefix to add to migration names (e.g., 'auth', 'todo') */
  readonly prefix: string;
}

/**
 * Discover migrations from an absolute path with a prefix.
 * The prefix ensures migrations from different packages don't conflict.
 *
 * @example
 * ```ts
 * import { discoverFromPath } from '@core/database';
 * import { dirname, join } from 'node:path';
 * import { fileURLToPath } from 'node:url';
 *
 * const __dirname = dirname(fileURLToPath(import.meta.url));
 *
 * export const TodoMigrations = discoverFromPath({
 *   path: join(__dirname, 'migrations'),
 *   prefix: 'todo',
 * });
 * ```
 */
export const discoverFromPath = (options: DiscoverOptions): PgMigrator.Loader =>
  Effect.gen(function* () {
    const { path: absolutePath, prefix } = options;

    const files = yield* Effect.tryPromise({
      try: () => readdir(absolutePath),
      catch: (error) => new Error(`Failed to read migrations directory ${absolutePath}: ${error}`),
    });

    const migrations: MigrationFile[] = [];

    for (const file of files) {
      if (!file.endsWith('.ts') || file.endsWith('.test.ts')) continue;

      const match = file.match(/^(\d+)_(.+)\.ts$/);
      if (!match) continue;

      const [, idStr, name] = match;
      const id = Number.parseInt(idStr, 10);

      migrations.push({
        id,
        name,
        path: join(absolutePath, file),
      });
    }

    migrations.sort((a, b) => a.id - b.id);

    return migrations.map((migration) => {
      const load = Effect.promise(() => import(/* @vite-ignore */ migration.path)).pipe(
        Effect.map((module) => module.default),
      );

      // Prefix the migration name to avoid conflicts between packages
      const prefixedName = `${prefix}_${migration.name}`;
      return [migration.id, prefixedName, load] as const;
    });
  }).pipe(Effect.orDie);

/**
 * Combine multiple migration loaders and assign globally unique IDs.
 * Migrations are processed in order: first loader's migrations get IDs 1, 2, 3...
 * second loader's migrations continue from there, etc.
 */
const combineMigrationLoaders = (loaders: ReadonlyArray<PgMigrator.Loader>): PgMigrator.Loader =>
  Effect.gen(function* () {
    const allMigrations = yield* Effect.all(loaders);
    const flattened = allMigrations.flat();

    // Re-assign global IDs to avoid duplicates
    return flattened.map((migration, index) => {
      const [_originalId, name, load] = migration;
      const globalId = index + 1;
      return [globalId, name, load] as const;
    });
  });

export const runMigrations = (
  ...loaders: ReadonlyArray<PgMigrator.Loader>
): Effect.Effect<void, never, never> =>
  Effect.gen(function* () {
    yield* Effect.log('[AutoMigration] Starting database migration check...');

    // First, discover all migrations to log them
    const combinedLoader = combineMigrationLoaders(loaders);
    const allMigrations = yield* combinedLoader;

    yield* Effect.log(`[AutoMigration] Found ${allMigrations.length} total migration(s):`);
    for (const [id, name] of allMigrations) {
      yield* Effect.log(`  - ${id.toString().padStart(4, '0')}_${name}`);
    }

    // Now run the migrations (re-execute the loader since PgMigrator needs it)
    const applied = yield* PgMigrator.run({
      loader: combinedLoader,
    });

    if (applied.length === 0) {
      yield* Effect.log('[AutoMigration] No new migrations to apply.');
    } else {
      yield* Effect.log(`[AutoMigration] Applied ${applied.length} new migration(s):`);
      for (const [id, name] of applied) {
        yield* Effect.log(`  - ${id.toString().padStart(4, '0')}_${name}`);
      }
    }

    yield* Effect.log('[AutoMigration] Database schema is up-to-date.');
  }).pipe(
    Effect.provide(Layer.merge(PgLive, BunContext.layer)),
    Effect.tapError((error) => Effect.logError(`[AutoMigration] Migration failed: ${error}`)),
    Effect.orDie,
  );

export const main = (): Promise<void> =>
  Effect.runPromise(
    Effect.gen(function* () {
      yield* Effect.log('Running migrations from command line...');
    }).pipe(Effect.provide(BunContext.layer)),
  ).then(() => BunRuntime.runMain(Effect.void));

if (import.meta.main) {
  main();
}
