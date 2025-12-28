import { ActiveQuizClient } from './features/active-quiz/client.js';
import { Data, Effect, Array as EffectArray } from 'effect';
import type { Quiz, QuizSession, UpsertQuizPayload } from '../quiz/schema.js';

// ============================================================================
// Query Atoms
// ============================================================================

type QuizCacheUpdate = Data.TaggedEnum<{
  Upsert: { readonly quiz: Quiz };
}>;

/**
 * Main active quiz atom with SSR support and optimistic updates.
 */
export const activeQuizAtom = (() => {
  const remoteAtom = ActiveQuizClient.runtime.atom(
    Effect.succeed([] as ReadonlyArray<QuizSession>),
  );

  return Object.assign(
    Atom.writable(
      (get) => get(remoteAtom),
      (ctx, update: QuizCacheUpdate) => {
        const current = ctx.get(activeQuizAtom);
        if (!Result.isSuccess(current)) return;

        const nextValue = (() => {
          switch (update._tag) {
            case 'Upsert': {
              const existingIndex = EffectArray.findFirstIndex(
                current.value,
                (q) => q.id === update.quiz.id,
              );
              return EffectArray.replace(
                current.value,
                existingIndex.getOrElse(() => 0),
                update.quiz,
              );
            }
          }
        })();

        ctx.setSelf(Result.success(nextValue));
      },
    ),
    { remote: remoteAtom },
  );
})();
