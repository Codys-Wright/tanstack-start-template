import { QuizClient } from './quiz-client.js';
import { Data, Effect, Array as EffectArray, Option } from 'effect';
import type { Quiz, UpsertQuizPayload } from '../schema.js';

// ============================================================================
// Query Atoms
// ============================================================================

type QuizCacheUpdate = Data.TaggedEnum<{
  Upsert: { readonly quiz: Quiz };
  Delete: { readonly id: string };
}>;

/**
 * Main quizzes atom with SSR support and optimistic updates.
 */
export const quizzesAtom = (() => {
  const remoteAtom = QuizClient.runtime.atom(
    Effect.gen(function* () {
      const client = yield* QuizClient;
      return yield* client('list');
    }),
  );

  return Object.assign(
    Atom.writable(
      (get) => get(remoteAtom),
      (ctx, update: QuizCacheUpdate) => {
        const current = ctx.get(quizzesAtom);
        if (!Result.isSuccess(current)) return;

        const nextValue = (() => {
          switch (update._tag) {
            case 'Upsert': {
              const existingIndex = EffectArray.findFirstIndex(
                current.value,
                (q) => q.id === update.quiz.id,
              );
              return Option.match(existingIndex, {
                onNone: () => EffectArray.prepend(current.value, update.quiz),
                onSome: (index) => EffectArray.replace(current.value, index, update.quiz),
              });
            }
            case 'Delete': {
              return EffectArray.filter(current.value, (q) => q.id !== update.id);
            }
          }
        })();

        ctx.setSelf(Result.success(nextValue));
      },
    ),
    { remote: remoteAtom },
  );
})();

// ============================================================================
// Mutation Atoms
// ============================================================================

export const createQuizAtom = QuizClient.runtime.fn<UpsertQuizPayload>()(
  Effect.fnUntraced(function* (input, get) {
    const client = yield* QuizClient;
    const result = yield* client('upsert', { input });
    get.set(quizzesAtom, { _tag: 'Upsert', quiz: result });
    return result;
  }),
);

export const deleteQuizAtom = QuizClient.runtime.fn<string>()(
  Effect.fnUntraced(function* (id, get) {
    const client = yield* QuizClient;
    yield* client('delete', { id });
    get.set(quizzesAtom, { _tag: 'Delete', id });
  }),
);
