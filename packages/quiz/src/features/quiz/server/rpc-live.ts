import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { QuizzesRpc } from '../domain/index.js';
import { QuizService } from './service.js';

/**
 * QuizzesRpcLive - RPC handler implementations for the quiz feature.
 *
 * This layer implements all RPC methods defined in QuizzesRpc,
 * delegating to the QuizService for business logic.
 */
export const QuizzesRpcLive = QuizzesRpc.toLayer(
  Effect.gen(function* () {
    const quizzes = yield* QuizService;

    return QuizzesRpc.of({
      quiz_list: Effect.fn(function* () {
        yield* Effect.log('[RPC] Listing quizzes');
        return yield* quizzes.list();
      }),

      quiz_listPublished: Effect.fn(function* () {
        yield* Effect.log('[RPC] Listing published quizzes');
        return yield* quizzes.listPublished();
      }),

      quiz_getById: Effect.fn(function* ({ id }) {
        yield* Effect.log(`[RPC] Getting quiz ${id}`);
        return yield* quizzes.getById(id);
      }),

      quiz_upsert: Effect.fn(function* ({ input }) {
        yield* Effect.log(`[RPC] Upserting quiz "${input.title}"`);
        return yield* quizzes.upsert(input);
      }),

      quiz_delete: Effect.fn(function* ({ id }) {
        yield* Effect.log(`[RPC] Deleting quiz ${id}`);
        return yield* quizzes.delete(id);
      }),
    });
  }),
).pipe(Layer.provide(QuizService.Default));
