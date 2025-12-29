/**
 * Example Database Seeders
 *
 * Composable seeders for creating fake features.
 * Uses @faker-js/faker for realistic data.
 */

import * as SqlClient from '@effect/sql/SqlClient';
import * as Effect from 'effect/Effect';
import { faker } from '@faker-js/faker';

import { makeCleanup, makeSeeder, type CleanupEntry, type SeederEntry } from '@core/database';

// ─────────────────────────────────────────────────────────────────────────────
// Feature Seeder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seeds fake features for demo/testing purposes.
 *
 * @example
 * ```ts
 * features()      // seed 20 features (default)
 * features(50)    // seed 50 features
 * ```
 */
export const features = makeSeeder({ name: 'features', defaultCount: 20, dependsOn: [] }, (count) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    // Check existing fake features
    const existing = yield* sql<{ count: string }>`
        SELECT COUNT(*)::text as count FROM features WHERE fake = true
      `;
    const existingCount = Number(existing[0].count);

    if (existingCount >= count) {
      return { name: 'features', existing: existingCount, created: 0 };
    }

    const toCreate = count - existingCount;
    let created = 0;

    for (let i = 0; i < toCreate; i++) {
      const name = faker.company.buzzPhrase();
      const description = faker.lorem.sentence();

      yield* sql`
          INSERT INTO features (id, name, description, fake, created_at, updated_at)
          VALUES (gen_random_uuid(), ${name}, ${description}, true, NOW(), NOW())
        `;

      created++;
    }

    return {
      name: 'features',
      existing: existingCount,
      created,
    };
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// Example Seed Composer
// ─────────────────────────────────────────────────────────────────────────────

interface ExampleSeedOptions {
  readonly features?: number;
}

/**
 * Compose example seeders with optional count overrides.
 *
 * @example
 * ```ts
 * example()                  // default (20 features)
 * example({ features: 50 })  // 50 features
 * ```
 */
export const example = (options: ExampleSeedOptions = {}): ReadonlyArray<SeederEntry> => [
  features(options.features),
];

// ─────────────────────────────────────────────────────────────────────────────
// Cleanup
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cleanup fake features.
 */
export const cleanupFeatures = makeCleanup({
  name: 'features',
  countSql: (sql) =>
    sql<{
      count: number;
    }>`SELECT COUNT(*)::int as count FROM features WHERE fake = true`.pipe(
      Effect.map((r) => r[0].count),
    ),
  deleteSql: (sql) => sql`DELETE FROM features WHERE fake = true`.pipe(Effect.asVoid),
});

/**
 * Get all example cleanup operations.
 */
export const exampleCleanup = (): ReadonlyArray<CleanupEntry> => [cleanupFeatures()];
