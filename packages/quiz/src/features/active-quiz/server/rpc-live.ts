import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { ActiveQuizRpc } from '../domain/rpc.js';
import { ActiveQuizServerService } from './service.js';

/**
 * ActiveQuizRpcLive - RPC handler layer for active quiz operations.
 */
export const ActiveQuizRpcLive = ActiveQuizRpc.toLayer(
  Effect.gen(function* () {
    const service = yield* ActiveQuizServerService;

    return ActiveQuizRpc.of({
      active_quiz_list: Effect.fn(function* () {
        yield* Effect.log('[RPC] Listing active quizzes');
        const result = yield* service.list();
        yield* Effect.log(`[RPC] Found ${result.length} active quizzes`);
        return result;
      }),

      active_quiz_getBySlug: Effect.fn(function* ({ slug }) {
        yield* Effect.log(`[RPC] Getting active quiz by slug: ${slug}`);
        return yield* service.getBySlug(slug);
      }),

      active_quiz_upsert: Effect.fn(function* ({ input }) {
        yield* Effect.log('[RPC] Upserting active quiz:', input.slug);
        return yield* service.upsert(input);
      }),

      active_quiz_delete: Effect.fn(function* ({ slug }) {
        yield* Effect.log(`[RPC] Deleting active quiz: ${slug}`);
        return yield* service.delete(slug);
      }),
    });
  }),
).pipe(Layer.provide(ActiveQuizServerService.Default));
