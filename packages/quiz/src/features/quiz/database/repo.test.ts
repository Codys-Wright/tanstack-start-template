import { expect, it } from '@effect/vitest';
import * as BunContext from '@effect/platform-bun/BunContext';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as SqlClient from '@effect/sql/SqlClient';
import { makePgTestMigrations, withTransactionRollback } from '@core/database';
import { QuizMigrations } from '../../../database/migrations.js';
import { QuizzesRepo } from './repo.js';
import type { QuizId } from '../domain/schema.js';
import { QuizNotFoundError } from '../domain/schema.js';

// Create test layer with quiz migrations applied
const PgTest = makePgTestMigrations(QuizMigrations);

// Repository layer for tests
const TestLayer = QuizzesRepo.DefaultWithoutDependencies.pipe(
  Layer.provideMerge(PgTest),
  Layer.provide(BunContext.layer),
);

// Helper to insert a test quiz directly via SQL
const insertTestQuiz = (data: {
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  version?: string;
  isPublished?: boolean;
  isTemp?: boolean;
}) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const id = data.id ?? crypto.randomUUID();
    const version = data.version ?? '{"semver":"1.0.0","comment":"Initial"}';
    yield* sql`
      INSERT INTO quizzes (id, title, subtitle, description, version, is_published, is_temp, questions, metadata)
      VALUES (
        ${id},
        ${data.title},
        ${data.subtitle ?? null},
        ${data.description ?? null},
        ${version}::jsonb,
        ${data.isPublished ?? false},
        ${data.isTemp ?? false},
        '[]'::jsonb,
        null
      )
    `;
    return id as QuizId;
  });

it.layer(TestLayer, { timeout: 30_000 })('QuizzesRepo', (it) => {
  it.scoped(
    'findAll - returns empty array when no quizzes exist',
    Effect.fn(function* () {
      const repo = yield* QuizzesRepo;
      const quizzes = yield* repo.findAll();
      expect(quizzes.length).toBe(0);
    }, withTransactionRollback),
  );

  it.scoped(
    'findAll - returns all non-deleted quizzes',
    Effect.fn(function* () {
      const repo = yield* QuizzesRepo;

      yield* insertTestQuiz({ title: 'Quiz 1' });
      yield* insertTestQuiz({ title: 'Quiz 2' });
      yield* insertTestQuiz({ title: 'Quiz 3' });

      const quizzes = yield* repo.findAll();
      expect(quizzes.length).toBe(3);
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - returns quiz when exists',
    Effect.fn(function* () {
      const repo = yield* QuizzesRepo;

      const id = yield* insertTestQuiz({
        title: 'Find Me Quiz',
        subtitle: 'A subtitle',
        description: 'A description',
      });

      const quiz = yield* repo.findById(id);
      expect(quiz.id).toBe(id);
      expect(quiz.title).toBe('Find Me Quiz');
      expect(quiz.subtitle).toBe('A subtitle');
      expect(quiz.description).toBe('A description');
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - fails with QuizNotFoundError when quiz does not exist',
    Effect.fn(function* () {
      const repo = yield* QuizzesRepo;
      const fakeId = crypto.randomUUID() as QuizId;

      const result = yield* repo.findById(fakeId).pipe(Effect.either);

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(QuizNotFoundError);
      }
    }, withTransactionRollback),
  );

  it.scoped(
    'findPublished - returns only published quizzes',
    Effect.fn(function* () {
      const repo = yield* QuizzesRepo;

      yield* insertTestQuiz({ title: 'Published 1', isPublished: true });
      yield* insertTestQuiz({ title: 'Draft 1', isPublished: false });
      yield* insertTestQuiz({ title: 'Published 2', isPublished: true });

      const published = yield* repo.findPublished();
      expect(published.length).toBe(2);
      expect(published.every((q) => q.isPublished)).toBe(true);
    }, withTransactionRollback),
  );

  it.scoped(
    'create - inserts a new quiz and returns it',
    Effect.fn(function* () {
      const repo = yield* QuizzesRepo;

      const quiz = yield* repo.create({
        title: 'New Quiz',
        subtitle: 'A subtitle',
        description: 'A description',
        version: { semver: '1.0.0', comment: 'Initial version' },
        questions: [],
        metadata: null,
        isPublished: false,
        isTemp: false,
      });

      expect(quiz.title).toBe('New Quiz');
      expect(quiz.subtitle).toBe('A subtitle');
      expect(quiz.description).toBe('A description');
      expect(quiz.isPublished).toBe(false);
      expect(quiz.id).toBeDefined();
    }, withTransactionRollback),
  );

  it.scoped(
    'update - updates quiz fields',
    Effect.fn(function* () {
      const repo = yield* QuizzesRepo;

      const id = yield* insertTestQuiz({ title: 'Original Title' });

      const updated = yield* repo.update({
        id,
        title: 'Updated Title',
        subtitle: 'New subtitle',
        description: 'New description',
        version: { semver: '1.1.0', comment: 'Updated' },
        questions: [],
        metadata: null,
        isPublished: true,
        isTemp: false,
      });

      expect(updated.id).toBe(id);
      expect(updated.title).toBe('Updated Title');
      expect(updated.subtitle).toBe('New subtitle');
      expect(updated.isPublished).toBe(true);
    }, withTransactionRollback),
  );

  it.scoped(
    'update - fails with QuizNotFoundError when quiz does not exist',
    Effect.fn(function* () {
      const repo = yield* QuizzesRepo;
      const fakeId = crypto.randomUUID() as QuizId;

      const result = yield* repo
        .update({
          id: fakeId,
          title: 'Does not matter',
          version: { semver: '1.0.0', comment: 'Test' },
          questions: [],
          metadata: null,
          isPublished: false,
          isTemp: false,
        })
        .pipe(Effect.either);

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(QuizNotFoundError);
      }
    }, withTransactionRollback),
  );

  it.scoped(
    'del - soft deletes a quiz (sets deleted_at)',
    Effect.fn(function* () {
      const repo = yield* QuizzesRepo;

      const id = yield* insertTestQuiz({ title: 'To Delete' });

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
    'del - fails with QuizNotFoundError when quiz does not exist',
    Effect.fn(function* () {
      const repo = yield* QuizzesRepo;
      const fakeId = crypto.randomUUID() as QuizId;

      const result = yield* repo.del(fakeId).pipe(Effect.either);

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(QuizNotFoundError);
      }
    }, withTransactionRollback),
  );

  it.scoped(
    'hardDelete - permanently removes a quiz',
    Effect.fn(function* () {
      const repo = yield* QuizzesRepo;
      const sql = yield* SqlClient.SqlClient;

      const id = yield* insertTestQuiz({ title: 'To Hard Delete' });

      // Hard delete
      yield* repo.hardDelete(id);

      // Should not exist even with direct query
      const result = yield* sql`SELECT id FROM quizzes WHERE id = ${id}`;
      expect(result.length).toBe(0);
    }, withTransactionRollback),
  );
});
