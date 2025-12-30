import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { ResponsesRpc } from '../domain/rpc.js';
import { ResponsesServerService } from './service.js';

/**
 * ResponsesRpcLive - RPC handler layer for quiz response operations.
 */
export const ResponsesRpcLive = ResponsesRpc.toLayer(
  Effect.gen(function* () {
    const service = yield* ResponsesServerService;

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
        return yield* service.upsert(input);
      }),

      response_delete: Effect.fn(function* ({ id }) {
        yield* Effect.log(`[RPC] Deleting response: ${id}`);
        return yield* service.delete(id);
      }),
    });
  }),
).pipe(Layer.provide(ResponsesServerService.Default));
