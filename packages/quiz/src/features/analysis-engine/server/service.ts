import { Version } from '@core/domain';
import * as Effect from 'effect/Effect';
import { AnalysisEngineRepo } from '../database/index.js';
import type { AnalysisEngineId, UpsertAnalysisEnginePayload } from '../domain/schema.js';

// Default version for new engines
const defaultVersion = new Version({
  semver: '1.0.0',
  comment: 'Initial version',
});

/**
 * AnalysisEngineServerService - Server-side service for analysis engine operations.
 *
 * This service wraps AnalysisEngineRepo and provides:
 * - CRUD operations for analysis engines
 * - Upsert logic (create or update based on id presence)
 *
 * All methods use Effect.fn for automatic OpenTelemetry tracing.
 */
export class AnalysisEngineServerService extends Effect.Service<AnalysisEngineServerService>()(
  'AnalysisEngineServerService',
  {
    dependencies: [AnalysisEngineRepo.Default],
    effect: Effect.gen(function* () {
      const repo = yield* AnalysisEngineRepo;

      return {
        /** List all analysis engines */
        list: Effect.fn('AnalysisEngineService.list')(function* () {
          const engines = yield* repo.findAll();
          yield* Effect.annotateCurrentSpan('engine.count', engines.length);
          return engines;
        }),

        /** List all published analysis engines */
        listPublished: Effect.fn('AnalysisEngineService.listPublished')(function* () {
          const engines = yield* repo.findPublished();
          yield* Effect.annotateCurrentSpan('engine.count', engines.length);
          return engines;
        }),

        /** Get analysis engine by ID */
        getById: Effect.fn('AnalysisEngineService.getById')(function* (id: AnalysisEngineId) {
          yield* Effect.annotateCurrentSpan('engine.id', id);
          return yield* repo.findById(id);
        }),

        /** Upsert an analysis engine (create if no id, update if id provided) */
        upsert: Effect.fn('AnalysisEngineService.upsert')(function* (
          input: UpsertAnalysisEnginePayload,
        ) {
          yield* Effect.annotateCurrentSpan('operation', input.id ? 'update' : 'create');

          if (input.id !== undefined) {
            yield* Effect.annotateCurrentSpan('engine.id', input.id);
            // Update existing engine - fetch existing to get required fields if not provided
            const existing = yield* repo.findById(input.id);

            return yield* repo.update({
              id: input.id,
              version: input.version ?? existing.version,
              name: input.name,
              description: input.description ?? existing.description,
              scoringConfig: input.scoringConfig,
              endings: input.endings,
              metadata: input.metadata ?? existing.metadata,
              isActive: input.isActive ?? existing.isActive,
              isPublished: input.isPublished ?? existing.isPublished,
              isTemp: input.isTemp ?? existing.isTemp,
              quizId: input.quizId ?? existing.quizId,
            });
          }

          // Create new engine - quizId is required for create
          if (input.quizId === undefined) {
            return yield* Effect.die(
              new Error('quizId is required when creating a new analysis engine'),
            );
          }

          yield* Effect.annotateCurrentSpan('quiz.id', input.quizId);
          return yield* repo.create({
            version: input.version ?? defaultVersion,
            name: input.name,
            description: input.description ?? null,
            scoringConfig: input.scoringConfig,
            endings: input.endings,
            metadata: input.metadata ?? undefined,
            isActive: input.isActive ?? true,
            isPublished: input.isPublished ?? false,
            isTemp: input.isTemp ?? false,
            quizId: input.quizId,
          });
        }),

        /** Delete an analysis engine (soft delete) */
        delete: Effect.fn('AnalysisEngineService.delete')(function* (id: AnalysisEngineId) {
          yield* Effect.annotateCurrentSpan('engine.id', id);
          return yield* repo.del(id);
        }),
      } as const;
    }),
  },
) {}
