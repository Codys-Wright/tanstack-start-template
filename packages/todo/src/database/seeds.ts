/**
 * Todo Database Seeders
 *
 * Composable seeders for creating fake todos.
 * Uses @faker-js/faker for realistic data.
 */

import { makeCleanup, makeSeeder, type CleanupEntry, type SeederEntry } from '@core/database';
import * as SqlClient from '@effect/sql/SqlClient';
import * as Effect from 'effect/Effect';
import { faker } from '@faker-js/faker';

// ─────────────────────────────────────────────────────────────────────────────
// Todo Seeder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seeds fake todos assigned to fake users.
 * Depends on users seeder.
 *
 * @example
 * ```ts
 * todos()      // seed 100 todos (default)
 * todos(200)   // seed 200 todos
 * ```
 */
export const todos = makeSeeder(
  { name: 'todos', defaultCount: 100, dependsOn: ['users'] },
  (count) =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      // Get fake users to assign todos to
      const fakeUsers = yield* sql<{ id: string }>`
        SELECT id FROM "user" WHERE fake = true
      `;

      if (fakeUsers.length === 0) {
        yield* Effect.logWarning('[todos] No fake users found, skipping');
        return { name: 'todos', existing: 0, created: 0 };
      }

      const userIds = fakeUsers.map((u) => u.id);

      // Check existing fake todos
      const existing = yield* sql<{ count: string }>`
        SELECT COUNT(*)::text as count FROM todos WHERE fake = true
      `;
      const existingCount = Number(existing[0].count);

      if (existingCount >= count) {
        return { name: 'todos', existing: existingCount, created: 0 };
      }

      const toCreate = count - existingCount;
      let created = 0;
      let completedCount = 0;
      let pendingCount = 0;

      for (let i = 0; i < toCreate; i++) {
        const userId = userIds[Math.floor(Math.random() * userIds.length)];
        const title = faker.hacker.phrase();
        const completed = Math.random() < 0.3; // 30% completed

        yield* sql`
          INSERT INTO todos (id, user_id, title, completed, fake, created_at)
          VALUES (gen_random_uuid(), ${userId}, ${title}, ${completed}, true, NOW())
        `;

        created++;
        if (completed) completedCount++;
        else pendingCount++;
      }

      return {
        name: 'todos',
        existing: existingCount,
        created,
        details: { completed: completedCount, pending: pendingCount },
      };
    }),
);

// ─────────────────────────────────────────────────────────────────────────────
// Todo Seed Composer
// ─────────────────────────────────────────────────────────────────────────────

interface TodoSeedOptions {
  readonly todos?: number;
}

/**
 * Compose todo seeders with optional count overrides.
 *
 * @example
 * ```ts
 * todo()              // default (100 todos)
 * todo({ todos: 200 })
 * ```
 */
export const todo = (options: TodoSeedOptions = {}): ReadonlyArray<SeederEntry> => [
  todos(options.todos),
];

// ─────────────────────────────────────────────────────────────────────────────
// Cleanup
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cleanup fake todos.
 */
export const cleanupTodos = makeCleanup({
  name: 'todos',
  countSql: (sql) =>
    sql<{
      count: number;
    }>`SELECT COUNT(*)::int as count FROM todos WHERE fake = true`.pipe(
      Effect.map((r) => r[0].count),
    ),
  deleteSql: (sql) => sql`DELETE FROM todos WHERE fake = true`.pipe(Effect.asVoid),
});

/**
 * Get all todo cleanup operations.
 */
export const todoCleanup = (): ReadonlyArray<CleanupEntry> => [cleanupTodos()];
