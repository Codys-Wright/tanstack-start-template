import { expect, it } from '@effect/vitest';
import * as BunContext from '@effect/platform-bun/BunContext';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as SqlClient from '@effect/sql/SqlClient';
import { makePgTestMigrations, withTransactionRollback } from '@core/database';
import { AuthMigrations } from '@auth/database';
import { CourseMigrations } from '../../../database/migrations.js';
import { CategoryRepository } from './repo.js';
import type { CategoryId } from '../domain/schema.js';
import { CategoryNotFoundError } from '../domain/schema.js';

// Combine auth + course migrations into a single loader
const CombinedMigrations = Effect.gen(function* () {
  const authMigrations = yield* AuthMigrations;
  const courseMigrations = yield* CourseMigrations;
  // Re-assign global IDs to avoid duplicates
  const all = [...authMigrations, ...courseMigrations];
  return all.map((migration, index) => {
    const [_originalId, name, load] = migration;
    return [index + 1, name, load] as const;
  });
});

// Create test layer with migrations applied
const PgTest = makePgTestMigrations(CombinedMigrations);

// Repository layer for tests
const TestLayer = CategoryRepository.DefaultWithoutDependencies.pipe(
  Layer.provideMerge(PgTest),
  Layer.provide(BunContext.layer),
);

// Helper to insert a test category directly via SQL
const insertTestCategory = (data: {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  sortOrder?: number;
  isActive?: boolean;
}) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const id = data.id ?? crypto.randomUUID();
    yield* sql`
      INSERT INTO course_categories (id, name, slug, description, parent_id, sort_order, is_active, created_at, updated_at)
      VALUES (
        ${id},
        ${data.name},
        ${data.slug},
        ${data.description ?? null},
        ${data.parentId ?? null},
        ${data.sortOrder ?? 0},
        ${data.isActive ?? true},
        NOW(),
        NOW()
      )
    `;
    return id as CategoryId;
  });

it.layer(TestLayer, { timeout: 30_000 })('CategoryRepository', (it) => {
  it.scoped(
    'findAll - returns empty array when no categories exist',
    Effect.fn(function* () {
      const repo = yield* CategoryRepository;
      const categories = yield* repo.findAll();
      expect(categories.length).toBe(0);
    }, withTransactionRollback),
  );

  it.scoped(
    'findAll - returns all categories',
    Effect.fn(function* () {
      const repo = yield* CategoryRepository;

      yield* insertTestCategory({ name: 'Category 1', slug: 'category-1' });
      yield* insertTestCategory({ name: 'Category 2', slug: 'category-2' });
      yield* insertTestCategory({ name: 'Category 3', slug: 'category-3' });

      const categories = yield* repo.findAll();
      expect(categories.length).toBe(3);
    }, withTransactionRollback),
  );

  it.scoped(
    'findActive - returns only active categories',
    Effect.fn(function* () {
      const repo = yield* CategoryRepository;

      yield* insertTestCategory({
        name: 'Active 1',
        slug: 'active-1',
        isActive: true,
      });
      yield* insertTestCategory({
        name: 'Inactive',
        slug: 'inactive',
        isActive: false,
      });
      yield* insertTestCategory({
        name: 'Active 2',
        slug: 'active-2',
        isActive: true,
      });

      const active = yield* repo.findActive();
      expect(active.length).toBe(2);
      expect(active.every((c) => c.isActive)).toBe(true);
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - returns category when exists',
    Effect.fn(function* () {
      const repo = yield* CategoryRepository;

      const id = yield* insertTestCategory({
        name: 'Find Me',
        slug: 'find-me',
        description: 'A test category',
      });

      const category = yield* repo.findById(id);
      expect(category.id).toBe(id);
      expect(category.name).toBe('Find Me');
      expect(category.slug).toBe('find-me');
      expect(category.description).toBe('A test category');
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - fails with CategoryNotFoundError when not exists',
    Effect.fn(function* () {
      const repo = yield* CategoryRepository;
      const fakeId = crypto.randomUUID() as CategoryId;

      const result = yield* repo.findById(fakeId).pipe(Effect.either);

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(CategoryNotFoundError);
      }
    }, withTransactionRollback),
  );

  it.scoped(
    'findBySlug - returns category when exists',
    Effect.fn(function* () {
      const repo = yield* CategoryRepository;

      yield* insertTestCategory({ name: 'Slug Test', slug: 'slug-test' });

      const category = yield* repo.findBySlug('slug-test');
      expect(category.name).toBe('Slug Test');
      expect(category.slug).toBe('slug-test');
    }, withTransactionRollback),
  );

  it.scoped(
    'findByParent - returns child categories',
    Effect.fn(function* () {
      const repo = yield* CategoryRepository;

      const parentId = yield* insertTestCategory({
        name: 'Parent',
        slug: 'parent',
      });
      yield* insertTestCategory({ name: 'Child 1', slug: 'child-1', parentId });
      yield* insertTestCategory({ name: 'Child 2', slug: 'child-2', parentId });
      yield* insertTestCategory({ name: 'Other', slug: 'other' }); // No parent

      const children = yield* repo.findByParent(parentId);
      expect(children.length).toBe(2);
      expect(children.every((c) => c.parentId === parentId)).toBe(true);
    }, withTransactionRollback),
  );

  it.scoped(
    'create - inserts a new category and returns it',
    Effect.fn(function* () {
      const repo = yield* CategoryRepository;

      const category = yield* repo.create({
        name: 'New Category',
        slug: 'new-category',
        description: 'A new category',
        sortOrder: 5,
      });

      expect(category.name).toBe('New Category');
      expect(category.slug).toBe('new-category');
      expect(category.description).toBe('A new category');
      expect(category.sortOrder).toBe(5);
      expect(category.isActive).toBe(true);
      expect(category.id).toBeDefined();
    }, withTransactionRollback),
  );

  it.scoped(
    'update - updates category fields',
    Effect.fn(function* () {
      const repo = yield* CategoryRepository;

      const id = yield* insertTestCategory({
        name: 'Original',
        slug: 'original',
      });

      const updated = yield* repo.update(id, {
        name: 'Updated Name',
        description: 'Updated description',
        isActive: false,
      });

      expect(updated.id).toBe(id);
      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Updated description');
      expect(updated.isActive).toBe(false);
    }, withTransactionRollback),
  );

  it.scoped(
    'update - fails with CategoryNotFoundError when not exists',
    Effect.fn(function* () {
      const repo = yield* CategoryRepository;
      const fakeId = crypto.randomUUID() as CategoryId;

      const result = yield* repo.update(fakeId, { name: 'Whatever' }).pipe(Effect.either);

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(CategoryNotFoundError);
      }
    }, withTransactionRollback),
  );

  it.scoped(
    'delete - removes a category',
    Effect.fn(function* () {
      const repo = yield* CategoryRepository;

      const id = yield* insertTestCategory({
        name: 'To Delete',
        slug: 'to-delete',
      });

      // Verify it exists
      const before = yield* repo.findAll();
      expect(before.length).toBe(1);

      // Delete
      yield* repo.delete(id);

      // Should no longer exist
      const after = yield* repo.findAll();
      expect(after.length).toBe(0);
    }, withTransactionRollback),
  );
});
