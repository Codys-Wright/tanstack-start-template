import { serializable } from '@core/client/atom-utils';
import { Atom, Result } from '@effect-atom/atom-react';
import * as RpcClientError from '@effect/rpc/RpcClientError';
import * as Arr from 'effect/Array';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import type { Version } from '@core/domain';
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

// ============================================================================
// Helper Atoms for Quiz Management
// ============================================================================

/**
 * Toggle quiz publish status.
 */
export const toggleQuizPublishAtom = QuizClient.runtime.fn<{
  quiz: Quiz;
  isPublished: boolean;
}>()(
  Effect.fnUntraced(function* (args, get) {
    const { isPublished, quiz } = args;
    const client = yield* QuizClient;
    const updatedQuiz = yield* client('quiz_upsert', {
      input: {
        id: quiz.id,
        isPublished,
        isTemp: quiz.isTemp,
        metadata: quiz.metadata ?? undefined,
        questions: quiz.questions,
        title: quiz.title,
        subtitle: quiz.subtitle,
        description: quiz.description,
        version: quiz.version,
      },
    });
    get.set(quizzesAtom, { _tag: 'Upsert', quiz: updatedQuiz });
    return updatedQuiz;
  }),
);

/**
 * Create a new quiz version.
 */
export const createNewQuizVersionAtom = QuizClient.runtime.fn<{
  quiz: Quiz;
  newVersion: Version;
  incrementType: 'major' | 'minor' | 'patch';
}>()(
  Effect.fnUntraced(function* (args) {
    const { newVersion, quiz } = args;
    const client = yield* QuizClient;

    const newQuiz = yield* client('quiz_upsert', {
      input: {
        description: quiz.description,
        isPublished: false,
        isTemp: false,
        metadata: quiz.metadata ?? undefined,
        questions: quiz.questions,
        subtitle: quiz.subtitle,
        title: quiz.title,
        version: newVersion,
      },
    });

    return newQuiz;
  }),
);

/**
 * Create a temporary quiz for editing.
 */
export const createTempQuizAtom = QuizClient.runtime.fn<{ quiz: Quiz }>()(
  Effect.fnUntraced(function* (args, get) {
    const { quiz } = args;
    const client = yield* QuizClient;

    const tempQuiz = yield* client('quiz_upsert', {
      input: {
        description: quiz.description,
        isPublished: false,
        isTemp: true,
        metadata: quiz.metadata ?? undefined,
        questions: quiz.questions,
        subtitle: quiz.subtitle,
        title: `${quiz.title} (Editing)`,
        version: quiz.version,
      },
    });

    get.set(quizzesAtom, { _tag: 'Upsert', quiz: tempQuiz });
    return tempQuiz;
  }),
);

/**
 * Auto-save temporary quiz changes (silent, no toast).
 */
export const autoSaveTempQuizAtom = QuizClient.runtime.fn<{ quiz: Quiz }>()(
  Effect.fnUntraced(function* (args, get) {
    const { quiz } = args;
    const client = yield* QuizClient;

    if (!quiz.isTemp) return quiz;

    const updatedQuiz = yield* client('quiz_upsert', {
      input: {
        id: quiz.id,
        description: quiz.description,
        isPublished: false,
        isTemp: true,
        metadata: quiz.metadata ?? undefined,
        questions: quiz.questions,
        subtitle: quiz.subtitle,
        title: quiz.title,
        version: quiz.version,
      },
    });

    get.set(quizzesAtom, { _tag: 'Upsert', quiz: updatedQuiz });
    return updatedQuiz;
  }),
);

/**
 * Save temporary quiz with version options.
 */
export const saveTempQuizAtom = QuizClient.runtime.fn<
  { quiz: Quiz; action: 'save' } | { quiz: Quiz; action: 'saveAsNew'; newVersion: Version }
>()(
  Effect.fnUntraced(function* (args, get) {
    const { action, quiz } = args;
    const client = yield* QuizClient;

    if (!quiz.isTemp) return quiz;

    if (action === 'save') {
      const savedQuiz = yield* client('quiz_upsert', {
        input: {
          id: quiz.id,
          description: quiz.description,
          isPublished: false,
          isTemp: false,
          metadata: quiz.metadata ?? undefined,
          questions: quiz.questions,
          subtitle: quiz.subtitle,
          title: quiz.title.replace(' (Editing)', ''),
          version: quiz.version,
        },
      });

      get.set(quizzesAtom, { _tag: 'Upsert', quiz: savedQuiz });
      return savedQuiz;
    }

    const newQuiz = yield* client('quiz_upsert', {
      input: {
        description: quiz.description,
        isPublished: false,
        isTemp: false,
        metadata: quiz.metadata ?? undefined,
        questions: quiz.questions,
        subtitle: quiz.subtitle,
        title: quiz.title.replace(' (Editing)', ''),
        version: args.newVersion,
      },
    });

    get.set(quizzesAtom, { _tag: 'Upsert', quiz: newQuiz });

    yield* client('quiz_delete', { id: quiz.id });
    get.set(quizzesAtom, { _tag: 'Delete', id: quiz.id });

    return newQuiz;
  }),
);

/**
 * Clear all temporary quizzes.
 */
export const clearTempQuizzesAtom = QuizClient.runtime.fn<void>()(
  Effect.fnUntraced(function* (_, get) {
    const client = yield* QuizClient;

    const quizzesResult = get(quizzesAtom);
    if (!Result.isSuccess(quizzesResult)) return 0;

    const tempQuizzes = quizzesResult.value.filter((q) => q.isTemp === true);

    yield* Effect.forEach(tempQuizzes, (quiz) => client('quiz_delete', { id: quiz.id }));

    for (const quiz of tempQuizzes) {
      get.set(quizzesAtom, { _tag: 'Delete', id: quiz.id });
    }

    return tempQuizzes.length;
  }),
);

/**
 * Create a matching temp engine for a temp quiz.
 */
export const createMatchingTempEngineAtom = QuizClient.runtime.fn<{
  quiz: Quiz;
}>()(
  Effect.fnUntraced(function* (args) {
    const { quiz } = args;
    const client = yield* QuizClient;

    if (quiz.isTemp !== true) return undefined;

    const allQuizzesResult = yield* client('quiz_list', undefined);
    const originalQuiz = allQuizzesResult.find(
      (q) => q.title === quiz.title.replace(' (Editing)', '') && q.isTemp === false,
    );

    if (originalQuiz === undefined) {
      throw new Error(`No original quiz found for temp quiz: ${quiz.title}`);
    }

    return undefined;
  }),
);

/**
 * Active Quiz atom - for getting currently active quiz.
 */
export const activeQuizAtom = (() => {
  const remoteAtom = QuizClient.runtime.atom(
    Effect.gen(function* () {
      const client = yield* QuizClient;
      const quizzes = yield* client('quiz_listPublished', undefined);
      return quizzes[0];
    }),
  );

  return Atom.readable((get) => get(remoteAtom));
})();
