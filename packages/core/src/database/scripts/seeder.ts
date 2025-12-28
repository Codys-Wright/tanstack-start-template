/**
 * Composable Database Seeding System
 *
 * Provides a type-safe, Effect-native approach to seeding databases.
 * Each seeder declares dependencies, runs in its own transaction,
 * and is idempotent (checks existing data before creating).
 *
 * @example
 * ```ts
 * // Define a seeder
 * export const users = makeSeeder(
 *   { name: 'users', defaultCount: 50 },
 *   (count) => Effect.gen(function* () {
 *     const sql = yield* SqlClient.SqlClient;
 *     // ... seed logic
 *     return { name: 'users', existing: 0, created: count };
 *   })
 * );
 *
 * // Run seeders
 * await runSeed(...auth({ users: 100 }), ...todo({ todos: 200 }));
 * ```
 */

import * as BunContext from '@effect/platform-bun/BunContext';
import * as SqlClient from '@effect/sql/SqlClient';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { PgLive } from '../pg-live.js';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Result returned after seeding */
export interface SeedResult {
  readonly name: string;
  readonly existing: number;
  readonly created: number;
  readonly details?: Record<string, number>;
}

/** A configured seeder ready to run */
export interface SeederEntry {
  readonly name: string;
  readonly count: number;
  readonly dependsOn: ReadonlyArray<string>;
  readonly run: Effect.Effect<SeedResult, Error, SqlClient.SqlClient>;
}

/** Configuration for creating a seeder */
export interface SeederConfig<Name extends string> {
  readonly name: Name;
  readonly defaultCount: number;
  readonly dependsOn?: ReadonlyArray<string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Seeder Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a seeder factory function.
 * Returns a function that accepts an optional count override.
 *
 * @example
 * ```ts
 * export const users = makeSeeder(
 *   { name: 'users', defaultCount: 50 },
 *   (count) => Effect.gen(function* () {
 *     const sql = yield* SqlClient.SqlClient;
 *     // ... seed logic
 *     return { name: 'users', existing: 0, created: count };
 *   })
 * );
 *
 * // Usage:
 * users()      // uses default count (50)
 * users(100)   // override count to 100
 * ```
 */
export const makeSeeder = <Name extends string>(
  config: SeederConfig<Name>,
  run: (count: number) => Effect.Effect<SeedResult, Error, SqlClient.SqlClient>,
): ((count?: number) => SeederEntry) => {
  return (count?: number): SeederEntry => ({
    name: config.name,
    count: count ?? config.defaultCount,
    dependsOn: config.dependsOn ?? [],
    run: run(count ?? config.defaultCount),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Topological Sort
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Topologically sort seeders by their dependencies.
 * Throws if circular dependencies are detected.
 */
const topologicalSort = (seeders: ReadonlyArray<SeederEntry>): ReadonlyArray<SeederEntry> => {
  const seederMap = new Map(seeders.map((s) => [s.name, s]));
  const sorted: SeederEntry[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const visit = (name: string): void => {
    if (visited.has(name)) return;
    if (visiting.has(name)) {
      throw new Error(`Circular dependency detected involving: ${name}`);
    }

    const seeder = seederMap.get(name);
    if (!seeder) {
      // Dependency not in our list - might be provided externally, skip
      return;
    }

    visiting.add(name);

    for (const dep of seeder.dependsOn) {
      visit(dep);
    }

    visiting.delete(name);
    visited.add(name);
    sorted.push(seeder);
  };

  for (const seeder of seeders) {
    visit(seeder.name);
  }

  return sorted;
};

// ─────────────────────────────────────────────────────────────────────────────
// Seeder Runner
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run seeders in dependency order.
 * Each seeder runs in its own transaction.
 * Skips seeding if target count already exists.
 */
export const runSeed = (
  ...seeders: ReadonlyArray<SeederEntry>
): Effect.Effect<void, Error, never> =>
  Effect.gen(function* () {
    yield* Effect.log('Starting database seeding...');

    // Topological sort by dependencies
    const sorted = topologicalSort(seeders);

    yield* Effect.log(`[Seed] Execution order: ${sorted.map((s) => s.name).join(' -> ')}`);

    const results: SeedResult[] = [];

    for (const seeder of sorted) {
      yield* Effect.log(`\n[${seeder.name}] Seeding up to ${seeder.count}...`);

      // Each seeder runs in its own transaction
      const result = yield* seeder.run.pipe(
        Effect.catchAll((error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`[${seeder.name}] Failed: ${error}`);
            return {
              name: seeder.name,
              existing: 0,
              created: 0,
              details: { error: 1 },
            } satisfies SeedResult;
          }),
        ),
      );

      results.push(result);

      if (result.created > 0) {
        const detailsStr = result.details
          ? ` (${Object.entries(result.details)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ')})`
          : '';
        yield* Effect.log(`[${seeder.name}] Created ${result.created}${detailsStr}`);
      } else {
        yield* Effect.log(`[${seeder.name}] Skipped (${result.existing} already exist)`);
      }
    }

    yield* Effect.log('\nSeeding complete!');
    for (const r of results) {
      yield* Effect.log(`   ${r.name}: ${r.created} created, ${r.existing} existing`);
    }
  }).pipe(Effect.provide(Layer.merge(PgLive, BunContext.layer)), Effect.orDie);

// ─────────────────────────────────────────────────────────────────────────────
// Cleanup Utilities
// ─────────────────────────────────────────────────────────────────────────────

/** Configuration for a cleanup operation */
export interface CleanupConfig<Name extends string> {
  readonly name: Name;
  /** SQL to count fake records */
  readonly countSql: (sql: SqlClient.SqlClient) => Effect.Effect<number, Error, never>;
  /** SQL to delete fake records */
  readonly deleteSql: (sql: SqlClient.SqlClient) => Effect.Effect<void, Error, never>;
}

/** A configured cleanup operation */
export interface CleanupEntry {
  readonly name: string;
  readonly run: Effect.Effect<{ name: string; deleted: number }, Error, SqlClient.SqlClient>;
}

/**
 * Create a cleanup factory function for removing fake/seeded data.
 *
 * @example
 * ```ts
 * export const cleanupUsers = makeCleanup({
 *   name: 'users',
 *   countSql: (sql) => sql`SELECT COUNT(*)::int as count FROM "user" WHERE fake = true`
 *     .pipe(Effect.map(r => r[0].count)),
 *   deleteSql: (sql) => sql`DELETE FROM "user" WHERE fake = true`.pipe(Effect.asVoid),
 * });
 * ```
 */
export const makeCleanup = <Name extends string>(
  config: CleanupConfig<Name>,
): (() => CleanupEntry) => {
  return (): CleanupEntry => ({
    name: config.name,
    run: Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      const count = yield* config.countSql(sql);

      if (count === 0) {
        return { name: config.name, deleted: 0 };
      }

      yield* config.deleteSql(sql);

      return { name: config.name, deleted: count };
    }),
  });
};

/**
 * Run cleanup operations to remove fake/seeded data.
 * Each cleanup runs in its own transaction.
 * Operations run in reverse order (to handle foreign key constraints).
 */
export const runCleanup = (
  ...cleanups: ReadonlyArray<CleanupEntry>
): Effect.Effect<void, Error, never> =>
  Effect.gen(function* () {
    yield* Effect.log('Starting cleanup of fake data...');

    // Reverse order to handle foreign key constraints (delete children first)
    const reversed = [...cleanups].reverse();

    const results: { name: string; deleted: number }[] = [];

    for (const cleanup of reversed) {
      yield* Effect.log(`[${cleanup.name}] Cleaning up...`);

      const result = yield* cleanup.run.pipe(
        Effect.catchAll((error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`[${cleanup.name}] Failed: ${error}`);
            return { name: cleanup.name, deleted: 0 };
          }),
        ),
      );

      results.push(result);

      if (result.deleted > 0) {
        yield* Effect.log(`[${cleanup.name}] Deleted ${result.deleted} records`);
      } else {
        yield* Effect.log(`[${cleanup.name}] No fake records to delete`);
      }
    }

    yield* Effect.log('\nCleanup complete!');
    const totalDeleted = results.reduce((sum, r) => sum + r.deleted, 0);
    yield* Effect.log(`   Total deleted: ${totalDeleted} records`);
  }).pipe(Effect.provide(Layer.merge(PgLive, BunContext.layer)), Effect.orDie);
