import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { Version } from '@core/domain';
import { AnalysisRpc, AnalysisFailedError, AnalysisSummary } from '../domain/index.js';
import { AnalysisServerService } from './service.js';

/**
 * AnalysisRpcLive - RPC handler implementations for the analysis feature.
 *
 * This layer implements all RPC methods defined in AnalysisRpc,
 * delegating to the AnalysisServerService for business logic.
 */
export const AnalysisRpcLive = AnalysisRpc.toLayer(
  Effect.gen(function* () {
    const analysis = yield* AnalysisServerService;

    return AnalysisRpc.of({
      analysis_list: Effect.fn(function* () {
        yield* Effect.log('[RPC] Listing analysis results');
        return yield* analysis.list();
      }),

      analysis_getById: Effect.fn(function* ({ id }) {
        yield* Effect.log(`[RPC] Getting analysis result ${id}`);
        return yield* analysis.getById(id);
      }),

      analysis_getByResponse: Effect.fn(function* ({ responseId }) {
        yield* Effect.log(`[RPC] Getting analysis results for response ${responseId}`);
        return yield* analysis.getByResponse(responseId);
      }),

      analysis_getByEngine: Effect.fn(function* ({ engineId }) {
        yield* Effect.log(`[RPC] Getting analysis results for engine ${engineId}`);
        return yield* analysis.getByEngine(engineId);
      }),

      analysis_analyze: Effect.fn(function* ({ request }) {
        yield* Effect.log(
          `[RPC] Analyzing response ${request.responseId} with engine ${request.engineId}`,
        );
        return yield* analysis.analyze(request).pipe(
          // Map unexpected errors to AnalysisFailedError
          Effect.catchAll((error) =>
            Effect.fail(
              new AnalysisFailedError({
                responseId: request.responseId,
                engineId: request.engineId,
                reason: `Analysis failed: ${String(error)}`,
              }),
            ),
          ),
        );
      }),

      analysis_batchAnalyze: Effect.fn(function* ({ request }) {
        yield* Effect.log(
          `[RPC] Batch analyzing ${request.responseIds.length} responses with engine ${request.engineId}`,
        );
        return yield* analysis.batchAnalyze(request).pipe(
          // Map unexpected errors to AnalysisFailedError
          Effect.catchAll((error) =>
            Effect.fail(
              new AnalysisFailedError({
                responseId: request.responseIds[0]!,
                engineId: request.engineId,
                reason: `Batch analysis failed: ${String(error)}`,
              }),
            ),
          ),
        );
      }),

      analysis_upsert: Effect.fn(function* ({ input }) {
        yield* Effect.log(`[RPC] Upserting analysis result`);
        return yield* analysis.upsert(input);
      }),

      analysis_getSummary: Effect.fn(function* ({ engineId }) {
        yield* Effect.log(`[RPC] Getting analysis summary for engine ${engineId}`);
        return yield* analysis.getSummary(engineId).pipe(
          // getSummary can fail with AnalysisResultNotFoundError but RPC expects never
          // So we return an empty summary instead
          Effect.catchAll(() =>
            Effect.gen(function* () {
              const now = yield* DateTime.now;
              return new AnalysisSummary({
                engineId,
                engineVersion: new Version({
                  semver: '0.0.0',
                  comment: 'No data',
                }),
                totalResponses: 0,
                endingDistribution: [],
                generatedAt: now,
              });
            }),
          ),
        );
      }),

      analysis_delete: Effect.fn(function* ({ id }) {
        yield* Effect.log(`[RPC] Deleting analysis result ${id}`);
        return yield* analysis.delete(id);
      }),
    });
  }),
).pipe(Layer.provide(AnalysisServerService.Default));
