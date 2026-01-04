import { expect, it } from '@effect/vitest';
import * as BunContext from '@effect/platform-bun/BunContext';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import { makePgTestMigrations, withTransactionRollback } from '@core/database';
import { ExampleMigrations } from '../../../database/migrations.js';
import { FeatureRepository } from './repo.js';

// Create test layer with migrations applied - provides both PgClient and SqlClient
const PgTest = makePgTestMigrations(ExampleMigrations);

// Repository layer for tests - use DefaultWithoutDependencies to avoid PgLive requiring DATABASE_URL
// Then provide the test PgClient which uses testcontainers
// BunContext.layer provides Path and CommandExecutor requirements
const TestLayer = FeatureRepository.DefaultWithoutDependencies.pipe(
  Layer.provideMerge(PgTest),
  Layer.provide(BunContext.layer),
);

it.layer(TestLayer, { timeout: 30_000 })('FeatureRepository', (it) => {
  it.scoped(
    'create - inserts a new feature and returns it',
    Effect.fn(function* () {
      const repo = yield* FeatureRepository;

      const feature = yield* repo.create({
        name: 'Test Feature',
        description: 'A test feature description',
      });

      expect(feature.name).toBe('Test Feature');
      expect(feature.description).toBe('A test feature description');
      expect(feature.id).toBeDefined();
      expect(feature.createdAt).toBeDefined();
      expect(feature.updatedAt).toBeDefined();
    }, withTransactionRollback),
  );

  it.scoped(
    'list - returns all features',
    Effect.fn(function* () {
      const repo = yield* FeatureRepository;

      // Initially empty
      const initial = yield* repo.list();
      expect(initial.length).toBe(0);

      // Create some features
      yield* repo.create({ name: 'Feature 1', description: 'First' });
      yield* repo.create({ name: 'Feature 2', description: 'Second' });

      const features = yield* repo.list();
      expect(features.length).toBe(2);
      // Check both features exist (order may vary due to same-millisecond creation)
      const names = features.map((f) => f.name).sort();
      expect(names).toEqual(['Feature 1', 'Feature 2']);
    }, withTransactionRollback),
  );

  it.scoped(
    'getById - returns the feature when it exists',
    Effect.fn(function* () {
      const repo = yield* FeatureRepository;

      const created = yield* repo.create({
        name: 'Find Me',
        description: 'A feature to find',
      });

      const found = yield* repo.getById(created.id);
      expect(found.id).toBe(created.id);
      expect(found.name).toBe('Find Me');
    }, withTransactionRollback),
  );

  it.scoped(
    'update - updates name only',
    Effect.fn(function* () {
      const repo = yield* FeatureRepository;

      const created = yield* repo.create({
        name: 'Original Name',
        description: 'Original Description',
      });

      const updated = yield* repo.update(created.id, {
        name: Option.some('Updated Name'),
        description: Option.none(),
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Original Description');
    }, withTransactionRollback),
  );

  it.scoped(
    'update - updates description only',
    Effect.fn(function* () {
      const repo = yield* FeatureRepository;

      const created = yield* repo.create({
        name: 'Original Name',
        description: 'Original Description',
      });

      const updated = yield* repo.update(created.id, {
        name: Option.none(),
        description: Option.some('Updated Description'),
      });

      expect(updated.name).toBe('Original Name');
      expect(updated.description).toBe('Updated Description');
    }, withTransactionRollback),
  );

  it.scoped(
    'update - updates both name and description',
    Effect.fn(function* () {
      const repo = yield* FeatureRepository;

      const created = yield* repo.create({
        name: 'Original Name',
        description: 'Original Description',
      });

      const updated = yield* repo.update(created.id, {
        name: Option.some('New Name'),
        description: Option.some('New Description'),
      });

      expect(updated.name).toBe('New Name');
      expect(updated.description).toBe('New Description');
    }, withTransactionRollback),
  );

  it.scoped(
    'remove - deletes the feature',
    Effect.fn(function* () {
      const repo = yield* FeatureRepository;

      const created = yield* repo.create({
        name: 'To Delete',
        description: 'Will be removed',
      });

      yield* repo.remove(created.id);

      const features = yield* repo.list();
      expect(features.length).toBe(0);
    }, withTransactionRollback),
  );
});
