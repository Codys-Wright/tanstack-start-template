import { serializable } from '@core/client/atom-utils';
import { Atom, Result } from '@effect-atom/atom-react';
import * as RpcClientError from '@effect/rpc/RpcClientError';
import * as Arr from 'effect/Array';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import { Quiz, QuizId, UpsertQuizPayload } from '../domain/index.js';
import { QuizClient } from './client.js';

const QuizzesSchema = Schema.Array(Quiz);

// ============================================================================
// Query Atoms
// ============================================================================

type QuizzesCacheUpdate = Data.TaggedEnum<{
  Upsert: { readonly quiz: Quiz };
  Delete: { readonly id: QuizId };
}>;

/**
 * Main quizzes atom with SSR support and optimistic updates.
 */
export const quizzesAtom = (() => {
  // Remote atom that fetches from the RPC
  const remoteAtom = QuizClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* QuizClient;
        return yield* client('quiz_list', undefined);
      }),
    )
    .pipe(
      serializable({
        key: '@quiz/quizzes',
        schema: Result.Schema({
          success: QuizzesSchema,
          error: RpcClientError.RpcClientError,
        }),
      }),
    );

  // Writable atom with local cache updates
  return Object.assign(
    Atom.writable(
      (get) => get(remoteAtom),
      (ctx, update: QuizzesCacheUpdate) => {
        const current = ctx.get(quizzesAtom);
        if (!Result.isSuccess(current)) return;

        const nextValue = (() => {
          switch (update._tag) {
            case 'Upsert': {
              const existingIndex = Arr.findFirstIndex(
                current.value,
                (q) => q.id === update.quiz.id,
              );
              return Option.match(existingIndex, {
                onNone: () => Arr.prepend(current.value, update.quiz),
                onSome: (index) => Arr.replace(current.value, index, update.quiz),
              });
            }
            case 'Delete': {
              return Arr.filter(current.value, (q) => q.id !== update.id);
            }
          }
        })();

        ctx.setSelf(Result.success(nextValue));
      },
      (refresh) => {
        refresh(remoteAtom);
      },
    ),
    { remote: remoteAtom },
  );
})();

// ============================================================================
// Mutation Atoms with Optimistic Updates
// ============================================================================

/**
 * Upsert quiz with optimistic cache update.
 */
export const upsertQuizAtom = QuizClient.runtime.fn<{
  input: UpsertQuizPayload;
}>()(
  Effect.fnUntraced(function* ({ input }, get) {
    const client = yield* QuizClient;
    const result = yield* client('quiz_upsert', { input });
    get.set(quizzesAtom, { _tag: 'Upsert', quiz: result });
    return result;
  }),
);

/**
 * Delete quiz with optimistic cache update.
 */
export const deleteQuizAtom = QuizClient.runtime.fn<QuizId>()(
  Effect.fnUntraced(function* (id, get) {
    const client = yield* QuizClient;
    yield* client('quiz_delete', { id });
    get.set(quizzesAtom, { _tag: 'Delete', id });
  }),
);

/**
 * Get quiz by ID.
 */
export const getQuizByIdAtom = QuizClient.runtime.fn<QuizId>()(
  Effect.fnUntraced(function* (id) {
    const client = yield* QuizClient;
    return yield* client('quiz_getById', { id });
  }),
);

/**
 * Get published quizzes only.
 */
export const publishedQuizzesAtom = (() => {
  const remoteAtom = QuizClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* QuizClient;
        return yield* client('quiz_listPublished', undefined);
      }),
    )
    .pipe(
      serializable({
        key: '@quiz/quizzes-published',
        schema: Result.Schema({
          success: QuizzesSchema,
          error: RpcClientError.RpcClientError,
        }),
      }),
    );

  return Object.assign(
    Atom.readable((get) => get(remoteAtom)),
    { remote: remoteAtom },
  );
})();
