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
        list: () => repo.findAll(),

        /** Get analysis result by ID */
        getById: (id: AnalysisResultId) => repo.findById(id),

        /** Get all analysis results for a response */
        getByResponse: (responseId: ResponseId) => repo.findByResponseId(responseId),

        /** Get all analysis results for an engine */
        getByEngine: (engineId: AnalysisEngineId) => repo.findByEngineId(engineId),

        /** Analyze a response with an engine */
        analyze: (request: AnalyzeResponseRequest) =>
          Effect.gen(function* () {
            // Look up the response
            const response = yield* responsesRepo.findById(request.responseId);

            // Look up the engine
            const engine = yield* engineRepo.findById(request.engineId);

            // Look up the quiz for this response
            const quiz = yield* quizzesRepo.findById(response.quizId);

            // Perform the analysis using AnalysisService
            const analysisData = yield* analysisService.analyzeWithValidation(
              engine,
              quiz,
              response,
            );

            // Save the result to the database
            const result = yield* repo.create({
              engineId: analysisData.engineId,
              engineVersion: analysisData.engineVersion,
              responseId: analysisData.responseId,
              endingResults: analysisData.endingResults,
              metadata: analysisData.metadata,
              analyzedAt: analysisData.analyzedAt,
            });

            return result;
          }),

        /** Batch analyze multiple responses */
        batchAnalyze: (request: BatchAnalyzeRequest) =>
          Effect.gen(function* () {
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
                }),
              ),
              { concurrency: 5 }, // Limit concurrency for batch operations
            );

            return results;
          }),

        /** Upsert an analysis result */
        upsert: (input: UpsertAnalysisResultPayload) =>
          Effect.gen(function* () {
            if (input.id !== undefined) {
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
        getSummary: (engineId: AnalysisEngineId) =>
          Effect.gen(function* () {
            const results = yield* repo.findByEngineId(engineId);
            return yield* analysisService.getAnalysisSummary(results, engineId);
          }),

        /** Delete an analysis result */
        delete: (id: AnalysisResultId) => repo.del(id),
      } as const;
    }),
  },
) {}
