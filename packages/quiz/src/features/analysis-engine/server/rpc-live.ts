import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { AnalysisEngineRpc } from '../domain/rpc.js';
import { AnalysisEngineServerService } from './service.js';

/**
 * AnalysisEngineRpcLive - RPC handler implementations for the analysis engine feature.
 *
 * This layer implements all RPC methods defined in AnalysisEngineRpc,
 * delegating to the AnalysisEngineServerService for business logic.
 */
export const AnalysisEngineRpcLive = AnalysisEngineRpc.toLayer(
  Effect.gen(function* () {
    const engineService = yield* AnalysisEngineServerService;

    return AnalysisEngineRpc.of({
      engine_list: Effect.fn(function* () {
        yield* Effect.log('[RPC] Listing analysis engines');
        return yield* engineService.list();
      }),

      engine_listPublished: Effect.fn(function* () {
        yield* Effect.log('[RPC] Listing published analysis engines');
        return yield* engineService.listPublished();
      }),

      engine_getById: Effect.fn(function* ({ id }) {
        yield* Effect.log(`[RPC] Getting analysis engine ${id}`);
        return yield* engineService.getById(id);
      }),

      engine_upsert: Effect.fn(function* ({ input }) {
        yield* Effect.log(`[RPC] Upserting analysis engine`);
        return yield* engineService.upsert(input);
      }),

      engine_delete: Effect.fn(function* ({ id }) {
        yield* Effect.log(`[RPC] Deleting analysis engine ${id}`);
        return yield* engineService.delete(id);
      }),
    });
  }),
).pipe(Layer.provide(AnalysisEngineServerService.Default));
