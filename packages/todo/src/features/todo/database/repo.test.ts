import { expect, it } from '@effect/vitest';
import * as BunContext from '@effect/platform-bun/BunContext';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import { makePgTestMigrations, withTransactionRollback } from '@core/database';
import { TodoMigrations } from '../../../database/migrations.js';
import { TodoRepository } from './repo.js';
import type { UserId } from '../domain/schema.js';

// Create test layer with migrations applied
const PgTest = makePgTestMigrations(TodoMigrations);

// Repository layer for tests - use DefaultWithoutDependencies to avoid PgLive requiring DATABASE_URL
// BunContext.layer provides Path and CommandExecutor requirements
const TestLayer = TodoRepository.DefaultWithoutDependencies.pipe(
  Layer.provideMerge(PgTest),
  Layer.provide(BunContext.layer),
);

// Test user ID (just a branded string, no actual user required)
const testUserId = 'test-user-123' as UserId;
const otherUserId = 'other-user-456' as UserId;

it.layer(TestLayer, { timeout: 30_000 })('TodoRepository', (it) => {
  it.scoped(
    'create - inserts a new todo and returns it',
    Effect.fn(function* () {
      const repo = yield* TodoRepository;

      const todo = yield* repo.create({
        userId: testUserId,
        input: { title: 'Test Todo' },
      });

      expect(todo.title).toBe('Test Todo');
      expect(todo.userId).toBe(testUserId);
      expect(todo.completed).toBe(false);
      expect(todo.id).toBeDefined();
      expect(todo.createdAt).toBeDefined();
    }, withTransactionRollback),
  );

  it.scoped(
    'list - returns todos for a specific user',
    Effect.fn(function* () {
      const repo = yield* TodoRepository;

      // Initially empty for this user
      const initial = yield* repo.list(testUserId);
      expect(initial.length).toBe(0);

      // Create todos for test user
      yield* repo.create({ userId: testUserId, input: { title: 'Todo 1' } });
      yield* repo.create({ userId: testUserId, input: { title: 'Todo 2' } });

      // Create a todo for another user (should not appear in list)
      yield* repo.create({
        userId: otherUserId,
        input: { title: 'Other Todo' },
      });

      const todos = yield* repo.list(testUserId);
      expect(todos.length).toBe(2);

      const titles = todos.map((t) => t.title).sort();
      expect(titles).toEqual(['Todo 1', 'Todo 2']);
    }, withTransactionRollback),
  );

  it.scoped(
    'getById - returns the todo when it exists and belongs to user',
    Effect.fn(function* () {
      const repo = yield* TodoRepository;

      const created = yield* repo.create({
        userId: testUserId,
        input: { title: 'Find Me' },
      });

      const found = yield* repo.getById({ id: created.id, userId: testUserId });
      expect(found.id).toBe(created.id);
      expect(found.title).toBe('Find Me');
    }, withTransactionRollback),
  );

  it.scoped(
    'update - updates title only',
    Effect.fn(function* () {
      const repo = yield* TodoRepository;

      const created = yield* repo.create({
        userId: testUserId,
        input: { title: 'Original Title' },
      });

      const updated = yield* repo.update(testUserId, created.id, {
        title: Option.some('Updated Title'),
        completed: Option.none(),
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.completed).toBe(false);
    }, withTransactionRollback),
  );

  it.scoped(
    'update - updates completed only',
    Effect.fn(function* () {
      const repo = yield* TodoRepository;

      const created = yield* repo.create({
        userId: testUserId,
        input: { title: 'Original Title' },
      });

      const updated = yield* repo.update(testUserId, created.id, {
        title: Option.none(),
        completed: Option.some(true),
      });

      expect(updated.title).toBe('Original Title');
      expect(updated.completed).toBe(true);
    }, withTransactionRollback),
  );

  it.scoped(
    'update - updates both title and completed',
    Effect.fn(function* () {
      const repo = yield* TodoRepository;

      const created = yield* repo.create({
        userId: testUserId,
        input: { title: 'Original Title' },
      });

      const updated = yield* repo.update(testUserId, created.id, {
        title: Option.some('New Title'),
        completed: Option.some(true),
      });

      expect(updated.title).toBe('New Title');
      expect(updated.completed).toBe(true);
    }, withTransactionRollback),
  );

  it.scoped(
    'update - returns existing todo when no changes provided',
    Effect.fn(function* () {
      const repo = yield* TodoRepository;

      const created = yield* repo.create({
        userId: testUserId,
        input: { title: 'Original Title' },
      });

      const updated = yield* repo.update(testUserId, created.id, {
        title: Option.none(),
        completed: Option.none(),
      });

      expect(updated.title).toBe('Original Title');
      expect(updated.completed).toBe(false);
    }, withTransactionRollback),
  );

  it.scoped(
    'remove - deletes the todo',
    Effect.fn(function* () {
      const repo = yield* TodoRepository;

      const created = yield* repo.create({
        userId: testUserId,
        input: { title: 'To Delete' },
      });

      yield* repo.remove({ userId: testUserId, id: created.id });

      const todos = yield* repo.list(testUserId);
      expect(todos.length).toBe(0);
    }, withTransactionRollback),
  );

  it.scoped(
    'remove - only deletes todo for the correct user',
    Effect.fn(function* () {
      const repo = yield* TodoRepository;

      const created = yield* repo.create({
        userId: testUserId,
        input: { title: 'My Todo' },
      });

      // Try to delete with different user - should not delete
      yield* repo.remove({ userId: otherUserId, id: created.id });

      // Todo should still exist for original user
      const todos = yield* repo.list(testUserId);
      expect(todos.length).toBe(1);
    }, withTransactionRollback),
  );
});
