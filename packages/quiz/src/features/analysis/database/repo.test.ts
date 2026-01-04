import { expect, it } from '@effect/vitest';
import * as BunContext from '@effect/platform-bun/BunContext';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as SqlClient from '@effect/sql/SqlClient';
import { makePgTestMigrations, withTransactionRollback } from '@core/database';
import { QuizMigrations } from '../../../database/migrations.js';
import { AnalysisRepo } from './repo.js';
import {
  AnalysisResultNotFoundError,
  AnalysisResultNotFoundForResponseError,
} from '../domain/schema.js';
import type { AnalysisEngineId, AnalysisResultId } from '../../analysis-engine/domain/schema.js';
import { defaultScoringConfig } from '../../analysis-engine/domain/schema.js';
import type { QuizId } from '../../quiz/domain/schema.js';
import type { ResponseId } from '../../responses/domain/schema.js';

// Create test layer with quiz migrations applied
const PgTest = makePgTestMigrations(QuizMigrations);

// Repository layer for tests
const TestLayer = AnalysisRepo.DefaultWithoutDependencies.pipe(
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

// Helper to insert a test analysis engine (required for foreign key)
const insertTestEngine = (data: { id?: string; quizId: QuizId; name?: string }) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const id = data.id ?? crypto.randomUUID();
    const scoringConfig = JSON.stringify(defaultScoringConfig);
    yield* sql`
      INSERT INTO analysis_engines (id, quiz_id, name, version, scoring_config, endings, is_active, is_published, is_temp)
      VALUES (
        ${id},
        ${data.quizId},
        ${data.name ?? 'Test Engine'},
        '{"semver":"1.0.0","comment":"Test"}'::jsonb,
        ${scoringConfig}::jsonb,
        '[]'::jsonb,
        true,
        false,
        false
      )
    `;
    return id as AnalysisEngineId;
  });

// Helper to insert a test response (required for foreign key)
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

// Helper to insert a test analysis result directly via SQL
const insertTestAnalysisResult = (data: {
  id?: string;
  engineId: AnalysisEngineId;
  responseId: ResponseId;
}) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const id = data.id ?? crypto.randomUUID();
    const endingResults = JSON.stringify([
      { endingId: 'type-a', points: 80, percentage: 80, isWinner: true },
      { endingId: 'type-b', points: 20, percentage: 20, isWinner: false },
    ]);
    yield* sql`
      INSERT INTO analysis_results (id, engine_id, engine_version, response_id, ending_results, analyzed_at)
      VALUES (
        ${id},
        ${data.engineId},
        '{"semver":"1.0.0","comment":"Test"}'::jsonb,
        ${data.responseId},
        ${endingResults}::jsonb,
        now()
      )
    `;
    return id as AnalysisResultId;
  });

it.layer(TestLayer, { timeout: 30_000 })('AnalysisRepo', (it) => {
  it.scoped(
    'findAll - returns empty array when no results exist',
    Effect.fn(function* () {
      const repo = yield* AnalysisRepo;
      const results = yield* repo.findAll();
      expect(results.length).toBe(0);
    }, withTransactionRollback),
  );

  it.scoped(
    'findAll - returns all non-deleted results',
    Effect.fn(function* () {
      const repo = yield* AnalysisRepo;

      const quizId = yield* insertTestQuiz();
      const engineId = yield* insertTestEngine({ quizId });
      const response1 = yield* insertTestResponse({ quizId });
      const response2 = yield* insertTestResponse({ quizId });
      const response3 = yield* insertTestResponse({ quizId });

      yield* insertTestAnalysisResult({ engineId, responseId: response1 });
      yield* insertTestAnalysisResult({ engineId, responseId: response2 });
      yield* insertTestAnalysisResult({ engineId, responseId: response3 });

      const results = yield* repo.findAll();
      expect(results.length).toBe(3);
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - returns result when exists',
    Effect.fn(function* () {
      const repo = yield* AnalysisRepo;

      const quizId = yield* insertTestQuiz();
      const engineId = yield* insertTestEngine({ quizId });
      const responseId = yield* insertTestResponse({ quizId });
      const id = yield* insertTestAnalysisResult({ engineId, responseId });

      const result = yield* repo.findById(id);
      expect(result.id).toBe(id);
      expect(result.engineId).toBe(engineId);
      expect(result.responseId).toBe(responseId);
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - fails with AnalysisResultNotFoundError when result does not exist',
    Effect.fn(function* () {
      const repo = yield* AnalysisRepo;
      const fakeId = crypto.randomUUID() as AnalysisResultId;

      const result = yield* repo.findById(fakeId).pipe(Effect.either);

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(AnalysisResultNotFoundError);
      }
    }, withTransactionRollback),
  );

  it.scoped(
    'findByResponseId - returns results for a specific response',
    Effect.fn(function* () {
      const repo = yield* AnalysisRepo;

      const quizId = yield* insertTestQuiz();
      const engine1 = yield* insertTestEngine({ quizId, name: 'Engine 1' });
      const engine2 = yield* insertTestEngine({ quizId, name: 'Engine 2' });
      const responseId = yield* insertTestResponse({ quizId });
      const otherResponse = yield* insertTestResponse({ quizId });

      // Create results for target response with different engines
      yield* insertTestAnalysisResult({ engineId: engine1, responseId });
      yield* insertTestAnalysisResult({ engineId: engine2, responseId });

      // Create result for other response
      yield* insertTestAnalysisResult({
        engineId: engine1,
        responseId: otherResponse,
      });

      const results = yield* repo.findByResponseId(responseId);
      expect(results.length).toBe(2);
      expect(results.every((r) => r.responseId === responseId)).toBe(true);
    }, withTransactionRollback),
  );

  it.scoped(
    'findByEngineId - returns results for a specific engine',
    Effect.fn(function* () {
      const repo = yield* AnalysisRepo;

      const quizId = yield* insertTestQuiz();
      const targetEngine = yield* insertTestEngine({
        quizId,
        name: 'Target Engine',
      });
      const otherEngine = yield* insertTestEngine({
        quizId,
        name: 'Other Engine',
      });
      const response1 = yield* insertTestResponse({ quizId });
      const response2 = yield* insertTestResponse({ quizId });

      // Create results for target engine
      yield* insertTestAnalysisResult({
        engineId: targetEngine,
        responseId: response1,
      });
      yield* insertTestAnalysisResult({
        engineId: targetEngine,
        responseId: response2,
      });

      // Create result for other engine
      yield* insertTestAnalysisResult({
        engineId: otherEngine,
        responseId: response1,
      });

      const results = yield* repo.findByEngineId(targetEngine);
      expect(results.length).toBe(2);
      expect(results.every((r) => r.engineId === targetEngine)).toBe(true);
    }, withTransactionRollback),
  );

  it.scoped(
    'findByResponseAndEngine - returns result for specific combination',
    Effect.fn(function* () {
      const repo = yield* AnalysisRepo;

      const quizId = yield* insertTestQuiz();
      const engineId = yield* insertTestEngine({ quizId });
      const responseId = yield* insertTestResponse({ quizId });
      const id = yield* insertTestAnalysisResult({ engineId, responseId });

      const result = yield* repo.findByResponseAndEngine(responseId, engineId);
      expect(result.id).toBe(id);
      expect(result.engineId).toBe(engineId);
      expect(result.responseId).toBe(responseId);
    }, withTransactionRollback),
  );

  it.scoped(
    'findByResponseAndEngine - fails with AnalysisResultNotFoundForResponseError when not found',
    Effect.fn(function* () {
      const repo = yield* AnalysisRepo;

      const quizId = yield* insertTestQuiz();
      const engineId = yield* insertTestEngine({ quizId });
      const responseId = yield* insertTestResponse({ quizId });
      // Don't create an analysis result

      const result = yield* repo.findByResponseAndEngine(responseId, engineId).pipe(Effect.either);

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(AnalysisResultNotFoundForResponseError);
      }
    }, withTransactionRollback),
  );

  it.scoped(
    'create - inserts a new analysis result and returns it',
    Effect.fn(function* () {
      const repo = yield* AnalysisRepo;

      const quizId = yield* insertTestQuiz();
      const engineId = yield* insertTestEngine({ quizId });
      const responseId = yield* insertTestResponse({ quizId });

      const now = DateTime.unsafeNow();
      const result = yield* repo.create({
        engineId,
        engineVersion: { semver: '1.0.0', comment: 'Test' },
        responseId,
        endingResults: [
          { endingId: 'type-a', points: 75, percentage: 75, isWinner: true },
          { endingId: 'type-b', points: 25, percentage: 25, isWinner: false },
        ],
        metadata: null,
        analyzedAt: now,
      });

      expect(result.engineId).toBe(engineId);
      expect(result.responseId).toBe(responseId);
      expect(result.endingResults.length).toBe(2);
      expect(result.id).toBeDefined();
    }, withTransactionRollback),
  );

  it.scoped(
    'del - soft deletes an analysis result',
    Effect.fn(function* () {
      const repo = yield* AnalysisRepo;

      const quizId = yield* insertTestQuiz();
      const engineId = yield* insertTestEngine({ quizId });
      const responseId = yield* insertTestResponse({ quizId });
      const id = yield* insertTestAnalysisResult({ engineId, responseId });

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
    'del - fails with AnalysisResultNotFoundError when result does not exist',
    Effect.fn(function* () {
      const repo = yield* AnalysisRepo;
      const fakeId = crypto.randomUUID() as AnalysisResultId;

      const result = yield* repo.del(fakeId).pipe(Effect.either);

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(AnalysisResultNotFoundError);
      }
    }, withTransactionRollback),
  );

  it.scoped(
    'hardDelete - permanently removes an analysis result',
    Effect.fn(function* () {
      const repo = yield* AnalysisRepo;
      const sql = yield* SqlClient.SqlClient;

      const quizId = yield* insertTestQuiz();
      const engineId = yield* insertTestEngine({ quizId });
      const responseId = yield* insertTestResponse({ quizId });
      const id = yield* insertTestAnalysisResult({ engineId, responseId });

      // Hard delete
      yield* repo.hardDelete(id);

      // Should not exist even with direct query
      const result = yield* sql`SELECT id FROM analysis_results WHERE id = ${id}`;
      expect(result.length).toBe(0);
    }, withTransactionRollback),
  );
});
