import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { ResponsesRpc } from '../domain/rpc.js';
import { ResponsesServerService } from './service.js';
import { AnalysisServerService } from '../../analysis/server/service.js';
import { AnalysisEngineServerService } from '../../analysis-engine/server/service.js';

/**
 * ResponsesRpcLive - RPC handler layer for quiz response operations.
 */
export const ResponsesRpcLive = ResponsesRpc.toLayer(
  Effect.gen(function* () {
    const service = yield* ResponsesServerService;
    const analysisService = yield* AnalysisServerService;
    const engineService = yield* AnalysisEngineServerService;

    return ResponsesRpc.of({
      response_list: Effect.fn(function* () {
        yield* Effect.log('[RPC] Listing responses');
        const result = yield* service.list();
        yield* Effect.log(`[RPC] Found ${result.length} responses`);
        return result;
      }),

      response_getById: Effect.fn(function* ({ id }) {
        yield* Effect.log(`[RPC] Getting response by id: ${id}`);
        return yield* service.getById(id);
      }),

      response_getByQuiz: Effect.fn(function* ({ quizId }) {
        yield* Effect.log(`[RPC] Getting responses for quiz: ${quizId}`);
        return yield* service.getByQuizId(quizId);
      }),

      response_upsert: Effect.fn(function* ({ input }) {
        yield* Effect.log('[RPC] Upserting response');
        const savedResponse = yield* service.upsert(input);

        // Auto-analyze the response after saving (for new responses only)
        // Run synchronously so analysis is complete before returning to client
        if (input.id === undefined) {
          yield* Effect.gen(function* () {
            yield* Effect.log('[RPC] Auto-analyzing response:', savedResponse.id);

            // Get active engine
            const engines = yield* engineService.list();
            const activeEngine = engines.find((e) => e.isActive);

            if (activeEngine === undefined) {
              yield* Effect.log('[RPC] No active engine found, skipping auto-analysis');
              return;
            }

            // Trigger analysis (synchronously)
            const analysisResult = yield* analysisService.analyze({
              responseId: savedResponse.id,
              engineId: activeEngine.id,
            });

            yield* Effect.log('[RPC] Auto-analysis complete:', analysisResult.id);
          }).pipe(
            Effect.catchAll((error) => Effect.log('[RPC] Auto-analysis failed:', String(error))),
          );
        }

        return savedResponse;
      }),

      response_delete: Effect.fn(function* ({ id }) {
        yield* Effect.log(`[RPC] Deleting response: ${id}`);
        return yield* service.delete(id);
      }),
    });
  }),
).pipe(
  Layer.provide(ResponsesServerService.Default),
  Layer.provide(AnalysisServerService.Default),
  Layer.provide(AnalysisEngineServerService.Default),
);
