import { expect, it } from '@effect/vitest';
import * as BunContext from '@effect/platform-bun/BunContext';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as SqlClient from '@effect/sql/SqlClient';
import { makePgTestMigrations, withTransactionRollback } from '@core/database';
import { QuizMigrations } from '../../../database/migrations.js';
import { ActiveQuizRepo } from './repo.js';
import type { ActiveQuizId } from '../domain/schema.js';
import { ActiveQuizNotFoundError } from '../domain/schema.js';
import type { QuizId } from '../../quiz/domain/schema.js';
import type { AnalysisEngineId } from '../../analysis-engine/domain/schema.js';
import { defaultScoringConfig } from '../../analysis-engine/domain/schema.js';

// Create test layer with quiz migrations applied
const PgTest = makePgTestMigrations(QuizMigrations);

// Repository layer for tests
const TestLayer = ActiveQuizRepo.DefaultWithoutDependencies.pipe(
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
        true,
        false,
        '[]'::jsonb
      )
    `;
    return id as QuizId;
  });

// Helper to insert a test analysis engine (required for foreign key)
const insertTestEngine = (data: { id?: string; quizId: QuizId; name?: string }) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const id = data.id ?? crypto.randomUUID();
    const scoringConfig = JSON.stringify(defaultScoringConfig);
    yield* sql`
      INSERT INTO analysis_engines (id, quiz_id, name, description, version, scoring_config, endings, is_active, is_published, is_temp)
      VALUES (
        ${id},
        ${data.quizId},
        ${data.name ?? 'Test Engine'},
        null,
        '{"semver":"1.0.0","comment":"Test"}'::jsonb,
        ${scoringConfig}::jsonb,
        '[]'::jsonb,
        true,
        true,
        false
      )
    `;
    return id as AnalysisEngineId;
  });

// Helper to insert an active quiz directly via SQL
const insertActiveQuiz = (data: { slug: string; quizId: QuizId; engineId: AnalysisEngineId }) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const id = crypto.randomUUID();
    yield* sql`
      INSERT INTO active_quizzes (id, slug, quiz_id, engine_id)
      VALUES (${id}, ${data.slug}, ${data.quizId}, ${data.engineId})
    `;
    return id as ActiveQuizId;
  });

it.layer(TestLayer, { timeout: 30_000 })('ActiveQuizRepo', (it) => {
  it.scoped(
    'findAll - returns empty array when no active quizzes exist',
    Effect.fn(function* () {
      const repo = yield* ActiveQuizRepo;
      const quizzes = yield* repo.findAll();
      expect(quizzes.length).toBe(0);
    }, withTransactionRollback),
  );

  it.scoped(
    'findAll - returns all active quizzes',
    Effect.fn(function* () {
      const repo = yield* ActiveQuizRepo;

      const quizId = yield* insertTestQuiz();
      const engineId = yield* insertTestEngine({ quizId });

      yield* insertActiveQuiz({ slug: 'quiz-1', quizId, engineId });
      yield* insertActiveQuiz({ slug: 'quiz-2', quizId, engineId });
      yield* insertActiveQuiz({ slug: 'quiz-3', quizId, engineId });

      const quizzes = yield* repo.findAll();
      expect(quizzes.length).toBe(3);
    }, withTransactionRollback),
  );

  it.scoped(
    'findBySlug - returns active quiz when exists',
    Effect.fn(function* () {
      const repo = yield* ActiveQuizRepo;

      const quizId = yield* insertTestQuiz();
      const engineId = yield* insertTestEngine({ quizId });
      yield* insertActiveQuiz({ slug: 'my-quiz', quizId, engineId });

      const activeQuiz = yield* repo.findBySlug('my-quiz');
      expect(activeQuiz.slug).toBe('my-quiz');
      expect(activeQuiz.quizId).toBe(quizId);
      expect(activeQuiz.engineId).toBe(engineId);
    }, withTransactionRollback),
  );

  it.scoped(
    'findBySlug - fails with ActiveQuizNotFoundError when slug does not exist',
    Effect.fn(function* () {
      const repo = yield* ActiveQuizRepo;

      const result = yield* repo.findBySlug('non-existent-slug').pipe(Effect.either);

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(ActiveQuizNotFoundError);
      }
    }, withTransactionRollback),
  );

  it.scoped(
    'create - inserts a new active quiz and returns it',
    Effect.fn(function* () {
      const repo = yield* ActiveQuizRepo;

      const quizId = yield* insertTestQuiz();
      const engineId = yield* insertTestEngine({ quizId });

      const activeQuiz = yield* repo.create({
        slug: 'new-quiz',
        quizId,
        engineId,
      });

      expect(activeQuiz.slug).toBe('new-quiz');
      expect(activeQuiz.quizId).toBe(quizId);
      expect(activeQuiz.engineId).toBe(engineId);
      expect(activeQuiz.id).toBeDefined();
    }, withTransactionRollback),
  );

  it.scoped(
    'update - updates active quiz fields',
    Effect.fn(function* () {
      const repo = yield* ActiveQuizRepo;

      const quiz1 = yield* insertTestQuiz({ title: 'Quiz 1' });
      const quiz2 = yield* insertTestQuiz({ title: 'Quiz 2' });
      const engine1 = yield* insertTestEngine({
        quizId: quiz1,
        name: 'Engine 1',
      });
      const engine2 = yield* insertTestEngine({
        quizId: quiz2,
        name: 'Engine 2',
      });

      const id = yield* insertActiveQuiz({
        slug: 'update-test',
        quizId: quiz1,
        engineId: engine1,
      });

      const updated = yield* repo.update({
        id,
        slug: 'updated-slug',
        quizId: quiz2,
        engineId: engine2,
      });

      expect(updated.id).toBe(id);
      expect(updated.slug).toBe('updated-slug');
      expect(updated.quizId).toBe(quiz2);
      expect(updated.engineId).toBe(engine2);
    }, withTransactionRollback),
  );

  it.scoped(
    'update - fails with ActiveQuizNotFoundError when active quiz does not exist',
    Effect.fn(function* () {
      const repo = yield* ActiveQuizRepo;

      const quizId = yield* insertTestQuiz();
      const engineId = yield* insertTestEngine({ quizId });
      const fakeId = crypto.randomUUID() as ActiveQuizId;

      const result = yield* repo
        .update({
          id: fakeId,
          slug: 'does-not-matter',
          quizId,
          engineId,
        })
        .pipe(Effect.either);

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(ActiveQuizNotFoundError);
      }
    }, withTransactionRollback),
  );

  it.scoped(
    'deleteBySlug - removes an active quiz',
    Effect.fn(function* () {
      const repo = yield* ActiveQuizRepo;

      const quizId = yield* insertTestQuiz();
      const engineId = yield* insertTestEngine({ quizId });
      yield* insertActiveQuiz({ slug: 'to-delete', quizId, engineId });

      // Verify it exists
      const beforeDelete = yield* repo.findAll();
      expect(beforeDelete.length).toBe(1);

      // Delete
      yield* repo.deleteBySlug('to-delete');

      // Should no longer exist
      const afterDelete = yield* repo.findAll();
      expect(afterDelete.length).toBe(0);
    }, withTransactionRollback),
  );

  it.scoped(
    'deleteBySlug - fails with ActiveQuizNotFoundError when slug does not exist',
    Effect.fn(function* () {
      const repo = yield* ActiveQuizRepo;

      const result = yield* repo.deleteBySlug('non-existent-slug').pipe(Effect.either);

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(ActiveQuizNotFoundError);
      }
    }, withTransactionRollback),
  );
});
