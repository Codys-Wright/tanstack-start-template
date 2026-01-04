import { expect, it } from '@effect/vitest';
import * as BunContext from '@effect/platform-bun/BunContext';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as SqlClient from '@effect/sql/SqlClient';
import { makePgTestMigrations, withTransactionRollback } from '@core/database';
import { QuizMigrations } from '../../../database/migrations.js';
import { AnalysisEngineRepo } from './repo.js';
import type { AnalysisEngineId } from '../domain/schema.js';
import { AnalysisEngineNotFoundError, defaultScoringConfig } from '../domain/schema.js';
import type { QuizId } from '../../quiz/domain/schema.js';

// Create test layer with quiz migrations applied
const PgTest = makePgTestMigrations(QuizMigrations);

// Repository layer for tests
const TestLayer = AnalysisEngineRepo.DefaultWithoutDependencies.pipe(
  Layer.provideMerge(PgTest),
  Layer.provide(BunContext.layer),
);

// Helper to insert a test quiz (required for foreign key)
const insertTestQuiz = (data?: { id?: string; title?: string }) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const id = data?.id ?? crypto.randomUUID();
    yield* sql`
      INSERT INTO quizzes (id, title, version, is_published, is_temp, questions)
      VALUES (
        ${id},
        ${data?.title ?? 'Test Quiz'},
        '{"semver":"1.0.0","comment":"Test"}'::jsonb,
        false,
        false,
        '[]'::jsonb
      )
    `;
    return id as QuizId;
  });

// Helper to insert a test analysis engine directly via SQL
const insertTestEngine = (data: {
  id?: string;
  quizId: QuizId;
  name: string;
  description?: string;
  isActive?: boolean;
  isPublished?: boolean;
  isTemp?: boolean;
}) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const id = data.id ?? crypto.randomUUID();
    const scoringConfig = JSON.stringify(defaultScoringConfig);
    yield* sql`
      INSERT INTO analysis_engines (id, quiz_id, name, description, version, scoring_config, endings, is_active, is_published, is_temp)
      VALUES (
        ${id},
        ${data.quizId},
        ${data.name},
        ${data.description ?? null},
        '{"semver":"1.0.0","comment":"Test"}'::jsonb,
        ${scoringConfig}::jsonb,
        '[]'::jsonb,
        ${data.isActive ?? true},
        ${data.isPublished ?? false},
        ${data.isTemp ?? false}
      )
    `;
    return id as AnalysisEngineId;
  });

it.layer(TestLayer, { timeout: 30_000 })('AnalysisEngineRepo', (it) => {
  it.scoped(
    'findAll - returns empty array when no engines exist',
    Effect.fn(function* () {
      const repo = yield* AnalysisEngineRepo;
      const engines = yield* repo.findAll();
      expect(engines.length).toBe(0);
    }, withTransactionRollback),
  );

  it.scoped(
    'findAll - returns all non-deleted engines',
    Effect.fn(function* () {
      const repo = yield* AnalysisEngineRepo;

      const quizId = yield* insertTestQuiz();
      yield* insertTestEngine({ quizId, name: 'Engine 1' });
      yield* insertTestEngine({ quizId, name: 'Engine 2' });
      yield* insertTestEngine({ quizId, name: 'Engine 3' });

      const engines = yield* repo.findAll();
      expect(engines.length).toBe(3);
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - returns engine when exists',
    Effect.fn(function* () {
      const repo = yield* AnalysisEngineRepo;

      const quizId = yield* insertTestQuiz();
      const id = yield* insertTestEngine({
        quizId,
        name: 'Find Me Engine',
        description: 'A test engine',
      });

      const engine = yield* repo.findById(id);
      expect(engine.id).toBe(id);
      expect(engine.name).toBe('Find Me Engine');
      expect(engine.description).toBe('A test engine');
      expect(engine.quizId).toBe(quizId);
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - fails with AnalysisEngineNotFoundError when engine does not exist',
    Effect.fn(function* () {
      const repo = yield* AnalysisEngineRepo;
      const fakeId = crypto.randomUUID() as AnalysisEngineId;

      const result = yield* repo.findById(fakeId).pipe(Effect.either);

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(AnalysisEngineNotFoundError);
      }
    }, withTransactionRollback),
  );

  it.scoped(
    'findPublished - returns only published engines',
    Effect.fn(function* () {
      const repo = yield* AnalysisEngineRepo;

      const quizId = yield* insertTestQuiz();
      yield* insertTestEngine({
        quizId,
        name: 'Published 1',
        isPublished: true,
      });
      yield* insertTestEngine({ quizId, name: 'Draft 1', isPublished: false });
      yield* insertTestEngine({
        quizId,
        name: 'Published 2',
        isPublished: true,
      });

      const published = yield* repo.findPublished();
      expect(published.length).toBe(2);
      expect(published.every((e) => e.isPublished)).toBe(true);
    }, withTransactionRollback),
  );

  it.scoped(
    'create - inserts a new engine and returns it',
    Effect.fn(function* () {
      const repo = yield* AnalysisEngineRepo;

      const quizId = yield* insertTestQuiz();
      const engine = yield* repo.create({
        quizId,
        name: 'New Engine',
        description: 'A new analysis engine',
        version: { semver: '1.0.0', comment: 'Initial version' },
        scoringConfig: defaultScoringConfig,
        endings: [],
        metadata: null,
        isActive: true,
        isPublished: false,
        isTemp: false,
      });

      expect(engine.name).toBe('New Engine');
      expect(engine.description).toBe('A new analysis engine');
      expect(engine.quizId).toBe(quizId);
      expect(engine.isActive).toBe(true);
      expect(engine.id).toBeDefined();
    }, withTransactionRollback),
  );

  it.scoped(
    'create - unpublishes other engines when creating a published one',
    Effect.fn(function* () {
      const repo = yield* AnalysisEngineRepo;

      const quizId = yield* insertTestQuiz();
      // Create first published engine
      const engine1 = yield* repo.create({
        quizId,
        name: 'First Published',
        description: null,
        version: { semver: '1.0.0', comment: 'First' },
        scoringConfig: defaultScoringConfig,
        endings: [],
        metadata: null,
        isActive: true,
        isPublished: true,
        isTemp: false,
      });

      // Create second published engine for same quiz
      const engine2 = yield* repo.create({
        quizId,
        name: 'Second Published',
        description: null,
        version: { semver: '1.0.0', comment: 'Second' },
        scoringConfig: defaultScoringConfig,
        endings: [],
        metadata: null,
        isActive: true,
        isPublished: true,
        isTemp: false,
      });

      // Check that first is now unpublished
      const updatedEngine1 = yield* repo.findById(engine1.id);
      expect(updatedEngine1.isPublished).toBe(false);

      // Second should still be published
      expect(engine2.isPublished).toBe(true);
    }, withTransactionRollback),
  );

  it.scoped(
    'update - updates engine fields',
    Effect.fn(function* () {
      const repo = yield* AnalysisEngineRepo;

      const quizId = yield* insertTestQuiz();
      const id = yield* insertTestEngine({ quizId, name: 'Original Name' });

      const updated = yield* repo.update({
        id,
        quizId,
        name: 'Updated Name',
        description: 'Updated description',
        version: { semver: '1.1.0', comment: 'Updated' },
        scoringConfig: defaultScoringConfig,
        endings: [],
        metadata: null,
        isActive: false,
        isPublished: true,
        isTemp: false,
      });

      expect(updated.id).toBe(id);
      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Updated description');
      expect(updated.isActive).toBe(false);
      expect(updated.isPublished).toBe(true);
    }, withTransactionRollback),
  );

  it.scoped(
    'update - fails with AnalysisEngineNotFoundError when engine does not exist',
    Effect.fn(function* () {
      const repo = yield* AnalysisEngineRepo;
      const fakeId = crypto.randomUUID() as AnalysisEngineId;
      const quizId = yield* insertTestQuiz();

      const result = yield* repo
        .update({
          id: fakeId,
          quizId,
          name: 'Does not matter',
          description: null,
          version: { semver: '1.0.0', comment: 'Test' },
          scoringConfig: defaultScoringConfig,
          endings: [],
          metadata: null,
          isActive: true,
          isPublished: false,
          isTemp: false,
        })
        .pipe(Effect.either);

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(AnalysisEngineNotFoundError);
      }
    }, withTransactionRollback),
  );

  it.scoped(
    'del - soft deletes an engine',
    Effect.fn(function* () {
      const repo = yield* AnalysisEngineRepo;

      const quizId = yield* insertTestQuiz();
      const id = yield* insertTestEngine({ quizId, name: 'To Delete' });

      // Verify it exists
      const beforeDelete = yield* repo.findAll();
      expect(beforeDelete.length).toBe(1);

      // Soft delete
      yield* repo.del(id);

      // Should no longer appear in findAll
      const afterDelete = yield* repo.findAll();
      expect(afterDelete.length).toBe(0);
    }, withTransactionRollback),
  );

  it.scoped(
    'hardDelete - permanently removes an engine',
    Effect.fn(function* () {
      const repo = yield* AnalysisEngineRepo;
      const sql = yield* SqlClient.SqlClient;

      const quizId = yield* insertTestQuiz();
      const id = yield* insertTestEngine({ quizId, name: 'To Hard Delete' });

      // Hard delete
      yield* repo.hardDelete(id);

      // Should not exist even with direct query
      const result = yield* sql`SELECT id FROM analysis_engines WHERE id = ${id}`;
      expect(result.length).toBe(0);
    }, withTransactionRollback),
  );
});
