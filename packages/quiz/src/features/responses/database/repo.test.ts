import { expect, it } from '@effect/vitest';
import * as BunContext from '@effect/platform-bun/BunContext';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as SqlClient from '@effect/sql/SqlClient';
import { makePgTestMigrations, withTransactionRollback } from '@core/database';
import { QuizMigrations } from '../../../database/migrations.js';
import { ResponsesRepo } from './repo.js';
import type { ResponseId } from '../domain/schema.js';
import { ResponseNotFoundError } from '../domain/schema.js';
import type { QuizId } from '../../quiz/domain/schema.js';

// Create test layer with quiz migrations applied
const PgTest = makePgTestMigrations(QuizMigrations);

// Repository layer for tests
const TestLayer = ResponsesRepo.DefaultWithoutDependencies.pipe(
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

// Helper to insert a test response directly via SQL
const insertTestResponse = (data: { id?: string; quizId: QuizId }) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const id = data.id ?? crypto.randomUUID();
    const sessionMetadata = JSON.stringify({
      startedAt: new Date().toISOString(),
    });
    yield* sql`
      INSERT INTO responses (id, quiz_id, answers, session_metadata, interaction_logs)
      VALUES (
        ${id},
        ${data.quizId},
        '[]'::jsonb,
        ${sessionMetadata}::jsonb,
        '[]'::jsonb
      )
    `;
    return id as ResponseId;
  });

it.layer(TestLayer, { timeout: 30_000 })('ResponsesRepo', (it) => {
  it.scoped(
    'findAll - returns empty array when no responses exist',
    Effect.fn(function* () {
      const repo = yield* ResponsesRepo;
      const responses = yield* repo.findAll();
      expect(responses.length).toBe(0);
    }, withTransactionRollback),
  );

  it.scoped(
    'findAll - returns all non-deleted responses',
    Effect.fn(function* () {
      const repo = yield* ResponsesRepo;

      const quizId = yield* insertTestQuiz();
      yield* insertTestResponse({ quizId });
      yield* insertTestResponse({ quizId });
      yield* insertTestResponse({ quizId });

      const responses = yield* repo.findAll();
      expect(responses.length).toBe(3);
    }, withTransactionRollback),
  );

  it.scoped(
    'findAllSummary - returns responses without heavy columns',
    Effect.fn(function* () {
      const repo = yield* ResponsesRepo;

      const quizId = yield* insertTestQuiz();
      yield* insertTestResponse({ quizId });
      yield* insertTestResponse({ quizId });

      const responses = yield* repo.findAllSummary();
      expect(responses.length).toBe(2);
      // Summary should still have the core fields
      expect(responses[0].id).toBeDefined();
      expect(responses[0].quizId).toBe(quizId);
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - returns response when exists',
    Effect.fn(function* () {
      const repo = yield* ResponsesRepo;

      const quizId = yield* insertTestQuiz();
      const id = yield* insertTestResponse({ quizId });

      const response = yield* repo.findById(id);
      expect(response.id).toBe(id);
      expect(response.quizId).toBe(quizId);
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - fails with ResponseNotFoundError when response does not exist',
    Effect.fn(function* () {
      const repo = yield* ResponsesRepo;
      const fakeId = crypto.randomUUID() as ResponseId;

      const result = yield* repo.findById(fakeId).pipe(Effect.either);

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(ResponseNotFoundError);
      }
    }, withTransactionRollback),
  );

  it.scoped(
    'findByQuizId - returns responses for a specific quiz',
    Effect.fn(function* () {
      const repo = yield* ResponsesRepo;

      const quiz1 = yield* insertTestQuiz({ title: 'Quiz 1' });
      const quiz2 = yield* insertTestQuiz({ title: 'Quiz 2' });

      yield* insertTestResponse({ quizId: quiz1 });
      yield* insertTestResponse({ quizId: quiz1 });
      yield* insertTestResponse({ quizId: quiz2 });

      const quiz1Responses = yield* repo.findByQuizId(quiz1);
      expect(quiz1Responses.length).toBe(2);
      expect(quiz1Responses.every((r) => r.quizId === quiz1)).toBe(true);

      const quiz2Responses = yield* repo.findByQuizId(quiz2);
      expect(quiz2Responses.length).toBe(1);
    }, withTransactionRollback),
  );

  it.scoped(
    'create - inserts a new response and returns it',
    Effect.fn(function* () {
      const repo = yield* ResponsesRepo;

      const quizId = yield* insertTestQuiz();
      const now = DateTime.unsafeNow();
      const response = yield* repo.create({
        quizId,
        answers: [{ questionId: 'q1', value: 5 }],
        sessionMetadata: { startedAt: now },
        interactionLogs: [],
        metadata: null,
      });

      expect(response.quizId).toBe(quizId);
      expect(response.id).toBeDefined();
    }, withTransactionRollback),
  );

  it.scoped(
    'update - updates response fields',
    Effect.fn(function* () {
      const repo = yield* ResponsesRepo;

      const quizId = yield* insertTestQuiz();
      const id = yield* insertTestResponse({ quizId });

      const now = DateTime.unsafeNow();
      const updated = yield* repo.update({
        id,
        quizId,
        answers: [
          { questionId: 'q1', value: 8 },
          { questionId: 'q2', value: 3 },
        ],
        sessionMetadata: {
          startedAt: now,
          completedAt: now,
        },
        interactionLogs: [],
        metadata: { tags: ['updated'] },
      });

      expect(updated.id).toBe(id);
      expect(updated.answers?.length).toBe(2);
    }, withTransactionRollback),
  );

  it.scoped(
    'update - fails with ResponseNotFoundError when response does not exist',
    Effect.fn(function* () {
      const repo = yield* ResponsesRepo;
      const fakeId = crypto.randomUUID() as ResponseId;
      const quizId = yield* insertTestQuiz();

      const now = DateTime.unsafeNow();
      const result = yield* repo
        .update({
          id: fakeId,
          quizId,
          answers: [],
          sessionMetadata: { startedAt: now },
          interactionLogs: [],
          metadata: null,
        })
        .pipe(Effect.either);

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(ResponseNotFoundError);
      }
    }, withTransactionRollback),
  );

  it.scoped(
    'del - soft deletes a response',
    Effect.fn(function* () {
      const repo = yield* ResponsesRepo;

      const quizId = yield* insertTestQuiz();
      const id = yield* insertTestResponse({ quizId });

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
    'del - fails with ResponseNotFoundError when response does not exist',
    Effect.fn(function* () {
      const repo = yield* ResponsesRepo;
      const fakeId = crypto.randomUUID() as ResponseId;

      const result = yield* repo.del(fakeId).pipe(Effect.either);

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(ResponseNotFoundError);
      }
    }, withTransactionRollback),
  );

  it.scoped(
    'hardDelete - permanently removes a response',
    Effect.fn(function* () {
      const repo = yield* ResponsesRepo;
      const sql = yield* SqlClient.SqlClient;

      const quizId = yield* insertTestQuiz();
      const id = yield* insertTestResponse({ quizId });

      // Hard delete
      yield* repo.hardDelete(id);

      // Should not exist even with direct query
      const result = yield* sql`SELECT id FROM responses WHERE id = ${id}`;
      expect(result.length).toBe(0);
    }, withTransactionRollback),
  );
});
