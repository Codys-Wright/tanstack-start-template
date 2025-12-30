import * as Effect from 'effect/Effect';
import { AnalysisRepo } from '../database/index.js';
import { AnalysisService } from '../domain/service.js';
import type {
  AnalyzeResponseRequest,
  BatchAnalyzeRequest,
  UpsertAnalysisResultPayload,
} from '../domain/schema.js';
import type { AnalysisEngineId, AnalysisResultId } from '../../analysis-engine/domain/schema.js';
import type { ResponseId } from '../../responses/domain/schema.js';
import { AnalysisEngineRepo } from '../../analysis-engine/database/index.js';
import { ResponsesRepo } from '../../responses/database/index.js';
import { QuizzesRepo } from '../../quiz/database/index.js';

/**
 * AnalysisServerService - Server-side service for analysis operations.
 *
 * This service handles:
 * - CRUD operations via AnalysisRepo
 * - Analysis execution via AnalysisService (from domain)
 * - Lookups for related entities (quiz, response, engine)
 *
 * All methods use Effect.fn for automatic OpenTelemetry tracing.
 */
export class AnalysisServerService extends Effect.Service<AnalysisServerService>()(
  'AnalysisServerService',
  {
    dependencies: [
      AnalysisRepo.Default,
      AnalysisService.Default,
      AnalysisEngineRepo.Default,
      ResponsesRepo.Default,
      QuizzesRepo.Default,
    ],
    effect: Effect.gen(function* () {
      const repo = yield* AnalysisRepo;
      const analysisService = yield* AnalysisService;
      const engineRepo = yield* AnalysisEngineRepo;
      const responsesRepo = yield* ResponsesRepo;
      const quizzesRepo = yield* QuizzesRepo;

      return {
        /** List all analysis results */
        list: Effect.fn('AnalysisService.list')(function* () {
          const results = yield* repo.findAll();
          yield* Effect.annotateCurrentSpan('analysis.count', results.length);
          return results;
        }),

        /** Get analysis result by ID */
        getById: Effect.fn('AnalysisService.getById')(function* (id: AnalysisResultId) {
          yield* Effect.annotateCurrentSpan('analysis.id', id);
          return yield* repo.findById(id);
        }),

        /** Get all analysis results for a response */
        getByResponse: Effect.fn('AnalysisService.getByResponse')(function* (
          responseId: ResponseId,
        ) {
          yield* Effect.annotateCurrentSpan('response.id', responseId);
          const results = yield* repo.findByResponseId(responseId);
          yield* Effect.annotateCurrentSpan('analysis.count', results.length);
          return results;
        }),

        /** Get all analysis results for an engine */
        getByEngine: Effect.fn('AnalysisService.getByEngine')(function* (
          engineId: AnalysisEngineId,
        ) {
          yield* Effect.annotateCurrentSpan('engine.id', engineId);
          const results = yield* repo.findByEngineId(engineId);
          yield* Effect.annotateCurrentSpan('analysis.count', results.length);
          return results;
        }),

        /** Analyze a response with an engine */
        analyze: Effect.fn('AnalysisService.analyze')(function* (request: AnalyzeResponseRequest) {
          yield* Effect.annotateCurrentSpan('response.id', request.responseId);
          yield* Effect.annotateCurrentSpan('engine.id', request.engineId);

          // Look up the response
          const response = yield* responsesRepo.findById(request.responseId);

          // Look up the engine
          const engine = yield* engineRepo.findById(request.engineId);

          // Look up the quiz for this response
          const quiz = yield* quizzesRepo.findById(response.quizId);
          yield* Effect.annotateCurrentSpan('quiz.id', quiz.id);

          // Perform the analysis using AnalysisService
          const analysisData = yield* analysisService.analyzeWithValidation(engine, quiz, response);

          // Save the result to the database
          const result = yield* repo.create({
            engineId: analysisData.engineId,
            engineVersion: analysisData.engineVersion,
            responseId: analysisData.responseId,
            endingResults: analysisData.endingResults,
            metadata: analysisData.metadata,
            analyzedAt: analysisData.analyzedAt,
          });

          yield* Effect.annotateCurrentSpan('analysis.result_id', result.id);
          return result;
        }),

        /** Batch analyze multiple responses */
        batchAnalyze: Effect.fn('AnalysisService.batchAnalyze')(function* (
          request: BatchAnalyzeRequest,
        ) {
          yield* Effect.annotateCurrentSpan('engine.id', request.engineId);
          yield* Effect.annotateCurrentSpan('batch.size', request.responseIds.length);

          const results = yield* Effect.all(
            request.responseIds.map((responseId) =>
              Effect.gen(function* () {
                // Look up the response
                const response = yield* responsesRepo.findById(responseId);

                // Look up the engine
                const engine = yield* engineRepo.findById(request.engineId);

                // Look up the quiz for this response
                const quiz = yield* quizzesRepo.findById(response.quizId);

                // Perform the analysis
                const analysisData = yield* analysisService.analyzeWithValidation(
                  engine,
                  quiz,
                  response,
                );

                // Save the result
                const result = yield* repo.create({
                  engineId: analysisData.engineId,
                  engineVersion: analysisData.engineVersion,
                  responseId: analysisData.responseId,
                  endingResults: analysisData.endingResults,
                  metadata: analysisData.metadata,
                  analyzedAt: analysisData.analyzedAt,
                });

                return result;
              }).pipe(
                Effect.withSpan(`AnalysisService.batchAnalyze.item`, {
                  attributes: { 'response.id': responseId },
                }),
              ),
            ),
            { concurrency: 5 }, // Limit concurrency for batch operations
          );

          yield* Effect.annotateCurrentSpan('batch.completed', results.length);
          return results;
        }),

        /** Upsert an analysis result */
        upsert: Effect.fn('AnalysisService.upsert')(function* (input: UpsertAnalysisResultPayload) {
          yield* Effect.annotateCurrentSpan('engine.id', input.engineId);
          yield* Effect.annotateCurrentSpan('response.id', input.responseId);
          yield* Effect.annotateCurrentSpan('operation', input.id ? 'update' : 'create');

          if (input.id !== undefined) {
            yield* Effect.annotateCurrentSpan('analysis.id', input.id);
            return yield* repo.update({
              id: input.id,
              engineId: input.engineId,
              engineVersion: input.engineVersion,
              responseId: input.responseId,
              endingResults: input.endingResults,
              metadata: input.metadata,
              analyzedAt: input.analyzedAt,
            });
          }

          return yield* repo.create({
            engineId: input.engineId,
            engineVersion: input.engineVersion,
            responseId: input.responseId,
            endingResults: input.endingResults,
            metadata: input.metadata,
            analyzedAt: input.analyzedAt,
          });
        }),

        /** Get analysis summary for an engine */
        getSummary: Effect.fn('AnalysisService.getSummary')(function* (engineId: AnalysisEngineId) {
          yield* Effect.annotateCurrentSpan('engine.id', engineId);
          const results = yield* repo.findByEngineId(engineId);
          yield* Effect.annotateCurrentSpan('analysis.count', results.length);
          return yield* analysisService.getAnalysisSummary(results, engineId);
        }),

        /** Delete an analysis result */
        delete: Effect.fn('AnalysisService.delete')(function* (id: AnalysisResultId) {
          yield* Effect.annotateCurrentSpan('analysis.id', id);
          return yield* repo.del(id);
        }),
      } as const;
    }),
  },
) {}
