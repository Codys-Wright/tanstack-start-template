import { serializable } from '@core/client/atom-utils';
import { Atom, Result } from '@effect-atom/atom-react';
import * as RpcClientError from '@effect/rpc/RpcClientError';
import * as Arr from 'effect/Array';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import { Version } from '@core/domain';
import { Quiz, QuizId, UpsertQuizPayload } from '../domain/index.js';
import { QuizClient } from './client.js';
import { AnalysisEngineClient } from '../../analysis-engine/client/client.js';
import { enginesAtom, EngineAction } from '../../analysis-engine/client/atoms.js';
import { UpsertAnalysisEnginePayload } from '../../analysis-engine/domain/schema.js';

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
 * Also publishes/unpublishes the associated engine.
 */
export const toggleQuizPublishAtom = QuizClient.runtime.fn<{
  quiz: Quiz;
  isPublished: boolean;
}>()(
  Effect.fnUntraced(function* (args, get) {
    const { isPublished, quiz } = args;
    const client = yield* QuizClient;

    // Create properly serialized input payload
    const rawInput = {
      id: quiz.id,
      isPublished,
      isTemp: quiz.isTemp,
      metadata: quiz.metadata ?? undefined,
      questions: (quiz.questions ?? []).map((q) => ({
        id: q.id,
        order: q.order,
        title: q.title,
        subtitle: q.subtitle ?? undefined,
        description: q.description ?? undefined,
        data: q.data,
        metadata: q.metadata ?? undefined,
      })),
      title: quiz.title,
      subtitle: quiz.subtitle ?? undefined,
      description: quiz.description ?? undefined,
      version: {
        semver: quiz.version.semver,
        comment: quiz.version.comment,
      },
    };

    // Parse through JSON to strip undefined values and convert class instances
    const cleanedInput = JSON.parse(JSON.stringify(rawInput));
    const inputPayload = Schema.decodeUnknownSync(UpsertQuizPayload)(cleanedInput);

    const updatedQuiz = yield* client('quiz_upsert', { input: inputPayload });
    get.set(quizzesAtom, { _tag: 'Upsert', quiz: updatedQuiz });

    // Also publish/unpublish the associated engine
    const engineEffect = Effect.gen(function* () {
      const engineClient = yield* AnalysisEngineClient;
      const allEngines = yield* engineClient('engine_list', undefined);

      // Find the engine associated with this quiz (non-temp, matching quizId)
      const associatedEngine = allEngines.find(
        (engine) => engine.quizId === quiz.id && !engine.isTemp,
      );

      if (associatedEngine === undefined) {
        // eslint-disable-next-line no-console
        console.log('[toggleQuizPublishAtom] No associated engine found for quiz:', quiz.id);
        return undefined;
      }

      // eslint-disable-next-line no-console
      console.log('[toggleQuizPublishAtom] Updating engine publish status:', {
        engineId: associatedEngine.id,
        isPublished,
      });

      // Create properly serialized engine input
      const rawEngineInput = {
        id: associatedEngine.id,
        name: associatedEngine.name,
        quizId: associatedEngine.quizId,
        version: {
          semver: associatedEngine.version.semver,
          comment: associatedEngine.version.comment,
        },
        description: associatedEngine.description ?? undefined,
        scoringConfig: JSON.stringify(associatedEngine.scoringConfig),
        endings: JSON.stringify(associatedEngine.endings),
        metadata: associatedEngine.metadata ? JSON.stringify(associatedEngine.metadata) : undefined,
        isActive: associatedEngine.isActive,
        isPublished,
        isTemp: associatedEngine.isTemp,
      };

      const engineInput = Schema.decodeUnknownSync(UpsertAnalysisEnginePayload)(rawEngineInput);
      const updatedEngine = yield* engineClient('engine_upsert', {
        input: engineInput,
      });

      return updatedEngine;
    });

    const updatedEngine = yield* engineEffect.pipe(Effect.provide(AnalysisEngineClient.layer));

    if (updatedEngine !== undefined) {
      get.set(enginesAtom, EngineAction.Upsert({ engine: updatedEngine }));
    }

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
  Effect.fnUntraced(function* (args, get) {
    const { newVersion, quiz } = args;
    const client = yield* QuizClient;

    // 1. Create the new quiz version
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

    get.set(quizzesAtom, { _tag: 'Upsert', quiz: newQuiz });

    // 2. Find the original engine and create a matching engine version
    const engineEffect = Effect.gen(function* () {
      const engineClient = yield* AnalysisEngineClient;
      const allEngines = yield* engineClient('engine_list', undefined);

      // Find the engine for the original quiz, or any non-temp engine as fallback
      const originalEngine =
        allEngines.find((engine) => engine.quizId === quiz.id && engine.isTemp === false) ??
        allEngines.find((engine) => engine.isTemp === false);

      if (originalEngine !== undefined) {
        // Create a new engine version linked to the new quiz
        // UpsertAnalysisEnginePayload expects scoringConfig and endings as JSON strings
        const rawEngineInput = {
          name: originalEngine.name,
          quizId: newQuiz.id, // Link to the new quiz version!
          version: newVersion,
          description: originalEngine.description ?? undefined,
          scoringConfig: JSON.stringify(originalEngine.scoringConfig),
          endings: JSON.stringify(originalEngine.endings),
          metadata: originalEngine.metadata ? JSON.stringify(originalEngine.metadata) : undefined,
          isActive: originalEngine.isActive,
          isPublished: false,
          isTemp: false,
        };
        const engineInput = Schema.decodeUnknownSync(UpsertAnalysisEnginePayload)(rawEngineInput);

        const newEngine = yield* engineClient('engine_upsert', {
          input: engineInput,
        });

        // eslint-disable-next-line no-console
        console.log('📝 createNewQuizVersionAtom: Created engine for new quiz version:', {
          engineId: newEngine.id,
          quizId: newQuiz.id,
        });
        get.set(enginesAtom, EngineAction.Upsert({ engine: newEngine }));
        return newEngine;
      }
      return undefined;
    }).pipe(Effect.provide(AnalysisEngineClient.layer));

    yield* engineEffect;

    return newQuiz;
  }),
);

/**
 * Create a temporary quiz for editing.
 */
export const createTempQuizAtom = QuizClient.runtime.fn<{ quiz: Quiz }>()(
  Effect.fnUntraced(function* (args, get) {
    const { quiz } = args;
    // eslint-disable-next-line no-console
    console.log('📝 createTempQuizAtom: Starting with quiz:', {
      id: quiz.id,
      title: quiz.title,
      version: quiz.version,
      versionType: typeof quiz.version,
      versionProto: Object.prototype.toString.call(quiz.version),
    });

    const client = yield* QuizClient;

    // 1. Create the temp quiz
    // eslint-disable-next-line no-console
    console.log('📝 createTempQuizAtom: Calling quiz_upsert with input:', {
      title: `${quiz.title} (Editing)`,
      version: quiz.version,
      isTemp: true,
    });

    // Truncate title if needed (max 30 chars after adding suffix)
    const baseTitle = quiz.title.slice(0, 20); // Leave room for " (Editing)"
    const tempTitle = `${baseTitle} (Editing)`;

    // Build the raw input as plain objects - the RPC will handle serialization
    // We use Schema.decodeUnknownSync to convert from raw JSON to the schema types
    const rawInput = {
      description: quiz.description ?? undefined,
      isPublished: false,
      isTemp: true,
      metadata: quiz.metadata
        ? {
            tags: quiz.metadata.tags,
            customFields: quiz.metadata.customFields,
          }
        : undefined,
      questions: quiz.questions?.map((q) => ({
        id: q.id,
        order: q.order,
        title: q.title,
        subtitle: q.subtitle ?? undefined,
        description: q.description ?? undefined,
        data: q.data,
        metadata: q.metadata ?? undefined,
      })),
      subtitle: quiz.subtitle ?? undefined,
      title: tempTitle,
      version: {
        semver: quiz.version.semver,
        comment: quiz.version.comment,
      },
    };

    // Parse through JSON to strip undefined values (JSON doesn't support undefined)
    const cleanedInput = JSON.parse(JSON.stringify(rawInput));

    // Use Schema.decodeUnknownSync to properly construct the UpsertQuizPayload
    const inputPayload = Schema.decodeUnknownSync(UpsertQuizPayload)(cleanedInput);

    // eslint-disable-next-line no-console
    console.log('📝 createTempQuizAtom: Decoded input payload:', inputPayload);

    const tempQuiz = yield* client('quiz_upsert', {
      input: inputPayload,
    }).pipe(
      Effect.tap(() =>
        Effect.sync(() => {
          // eslint-disable-next-line no-console
          console.log('📝 createTempQuizAtom: quiz_upsert SUCCESS');
        }),
      ),
      Effect.tapError((error) =>
        Effect.sync(() => {
          // eslint-disable-next-line no-console
          console.error('📝 createTempQuizAtom: quiz_upsert ERROR:', error);
        }),
      ),
    );

    // eslint-disable-next-line no-console
    console.log('📝 createTempQuizAtom: Temp quiz created:', {
      id: tempQuiz.id,
      title: tempQuiz.title,
    });
    get.set(quizzesAtom, { _tag: 'Upsert', quiz: tempQuiz });

    // 2. Find the original engine for this quiz and create a temp copy
    // We need to run this in the AnalysisEngineClient's context
    // eslint-disable-next-line no-console
    console.log('📝 createTempQuizAtom: Looking for matching engine for quiz:', quiz.id);
    const engineEffect = Effect.gen(function* () {
      const engineClient = yield* AnalysisEngineClient;
      const allEngines = yield* engineClient('engine_list', undefined);
      // eslint-disable-next-line no-console
      console.log('📝 createTempQuizAtom: Found engines:', allEngines.length);

      // First try to find an engine directly linked to this quiz
      let originalEngine = allEngines.find(
        (engine) => engine.quizId === quiz.id && engine.isTemp === false,
      );

      // Fallback: find any non-temp engine (for cases where engine isn't linked to specific quiz version)
      if (originalEngine === undefined) {
        originalEngine = allEngines.find((engine) => engine.isTemp === false);
        // eslint-disable-next-line no-console
        console.log('📝 createTempQuizAtom: No direct engine match, using fallback engine');
      }

      // eslint-disable-next-line no-console
      console.log(
        '📝 createTempQuizAtom: Original engine:',
        originalEngine ? { id: originalEngine.id, name: originalEngine.name } : null,
      );

      if (originalEngine !== undefined) {
        // Clean up any existing temp engines for this temp quiz
        const existingTempEngines = allEngines.filter(
          (engine) => engine.quizId === tempQuiz.id && engine.isTemp === true,
        );
        for (const existingEngine of existingTempEngines) {
          yield* engineClient('engine_delete', { id: existingEngine.id });
          get.set(enginesAtom, EngineAction.Delete({ id: existingEngine.id }));
        }

        // Create a temp engine linked to the temp quiz
        // eslint-disable-next-line no-console
        console.log('📝 createTempQuizAtom: Creating temp engine...');

        // UpsertAnalysisEnginePayload expects scoringConfig and endings as JSON strings
        // (due to S.parseJson wrapper in the schema), so we must stringify them.
        // We use Schema.decodeUnknownSync to properly construct the payload.
        const rawEngineInput = {
          name: `${originalEngine.name} (Editing)`,
          quizId: tempQuiz.id, // Link to the temp quiz!
          version: originalEngine.version, // Version is S.optional(Version), not parseJson
          description: originalEngine.description ?? undefined,
          // scoringConfig and endings must be JSON strings for S.parseJson
          scoringConfig: JSON.stringify(originalEngine.scoringConfig),
          endings: JSON.stringify(originalEngine.endings),
          metadata: originalEngine.metadata ? JSON.stringify(originalEngine.metadata) : undefined,
          isActive: originalEngine.isActive,
          isPublished: false,
          isTemp: true,
        };

        const engineInput = Schema.decodeUnknownSync(UpsertAnalysisEnginePayload)(rawEngineInput);

        const tempEngine = yield* engineClient('engine_upsert', {
          input: engineInput,
        });

        // eslint-disable-next-line no-console
        console.log('📝 createTempQuizAtom: Temp engine created:', {
          id: tempEngine.id,
          name: tempEngine.name,
        });
        get.set(enginesAtom, EngineAction.Upsert({ engine: tempEngine }));
        return tempEngine;
      }
      // eslint-disable-next-line no-console
      console.log('📝 createTempQuizAtom: No matching engine found!');
      return undefined;
    }).pipe(Effect.provide(AnalysisEngineClient.layer));

    yield* engineEffect;

    // eslint-disable-next-line no-console
    console.log('📝 createTempQuizAtom: Complete, returning temp quiz');
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
 * Also saves the associated temp engine if one exists.
 */
export const saveTempQuizAtom = QuizClient.runtime.fn<
  { quiz: Quiz; action: 'save' } | { quiz: Quiz; action: 'saveAsNew'; newVersion: Version }
>()(
  Effect.fnUntraced(function* (args, get) {
    const { action, quiz } = args;
    const client = yield* QuizClient;

    if (!quiz.isTemp) return quiz;

    // Helper to create properly serialized quiz input payload
    const createQuizInputPayload = (version: Version, includeId: boolean) => {
      const rawInput = {
        ...(includeId ? { id: quiz.id } : {}),
        description: quiz.description ?? undefined,
        isPublished: false,
        isTemp: false,
        metadata: quiz.metadata ?? undefined,
        questions: (quiz.questions ?? []).map((q) => ({
          id: q.id,
          order: q.order,
          title: q.title,
          subtitle: q.subtitle ?? undefined,
          description: q.description ?? undefined,
          data: q.data,
          metadata: q.metadata ?? undefined,
        })),
        subtitle: quiz.subtitle ?? undefined,
        title: quiz.title.replace(' (Editing)', ''),
        version: {
          semver: version.semver,
          comment: version.comment,
        },
      };

      // Parse through JSON to strip undefined values and convert class instances
      const cleanedInput = JSON.parse(JSON.stringify(rawInput));
      return Schema.decodeUnknownSync(UpsertQuizPayload)(cleanedInput);
    };

    if (action === 'save') {
      const inputPayload = createQuizInputPayload(quiz.version, true);
      const savedQuiz = yield* client('quiz_upsert', { input: inputPayload });

      get.set(quizzesAtom, { _tag: 'Upsert', quiz: savedQuiz });
      return savedQuiz;
    }

    // saveAsNew - check for duplicate version first
    const quizzesResult = get(quizzesAtom);
    if (Result.isSuccess(quizzesResult)) {
      const baseTitle = quiz.title.replace(' (Editing)', '');
      const existingVersion = quizzesResult.value.find(
        (q) => q.title === baseTitle && q.version.semver === args.newVersion.semver && !q.isTemp,
      );
      if (existingVersion !== undefined) {
        throw new Error(
          `Version ${args.newVersion.semver} already exists for "${baseTitle}". Please use a different version number.`,
        );
      }
    }

    // Create new version without the temp quiz's ID
    const inputPayload = createQuizInputPayload(args.newVersion, false);
    const newQuiz = yield* client('quiz_upsert', { input: inputPayload });

    get.set(quizzesAtom, { _tag: 'Upsert', quiz: newQuiz });

    // Find and save the associated temp engine
    const engineEffect = Effect.gen(function* () {
      const engineClient = yield* AnalysisEngineClient;
      const allEngines = yield* engineClient('engine_list', undefined);

      // Find the temp engine associated with this temp quiz
      const tempEngine = allEngines.find(
        (engine) => engine.quizId === quiz.id && engine.isTemp === true,
      );

      if (tempEngine === undefined) {
        // eslint-disable-next-line no-console
        console.log('[saveTempQuizAtom] No temp engine found for quiz:', quiz.id);
        return undefined;
      }

      // eslint-disable-next-line no-console
      console.log('[saveTempQuizAtom] Found temp engine, saving as new version:', tempEngine.id);

      // Create a new permanent engine linked to the new quiz
      const rawEngineInput = {
        name: tempEngine.name,
        quizId: newQuiz.id,
        version: {
          semver: args.newVersion.semver,
          comment: args.newVersion.comment,
        },
        description: tempEngine.description ?? undefined,
        scoringConfig: JSON.stringify(tempEngine.scoringConfig),
        endings: JSON.stringify(tempEngine.endings),
        metadata: tempEngine.metadata ? JSON.stringify(tempEngine.metadata) : undefined,
        isActive: tempEngine.isActive,
        isPublished: false,
        isTemp: false,
      };

      const engineInput = Schema.decodeUnknownSync(UpsertAnalysisEnginePayload)(rawEngineInput);
      const newEngine = yield* engineClient('engine_upsert', {
        input: engineInput,
      });

      // eslint-disable-next-line no-console
      console.log('[saveTempQuizAtom] New engine created:', newEngine.id);

      // Delete the temp engine
      yield* engineClient('engine_delete', { id: tempEngine.id });

      return { newEngine, deletedEngineId: tempEngine.id };
    });

    // Run the engine effect within the AnalysisEngineClient context
    const engineResult = yield* engineEffect.pipe(Effect.provide(AnalysisEngineClient.layer));

    // Update engines atom if we saved an engine
    if (engineResult !== undefined) {
      get.set(enginesAtom, EngineAction.Upsert({ engine: engineResult.newEngine }));
      get.set(enginesAtom, EngineAction.Delete({ id: engineResult.deletedEngineId }));
    }

    // Delete the temp quiz
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
  tempQuiz: Quiz;
  originalQuizId: QuizId;
}>()(
  Effect.fnUntraced(function* (args, get) {
    const { tempQuiz, originalQuizId } = args;

    if (tempQuiz.isTemp !== true) return undefined;

    // Create the temp engine in the AnalysisEngineClient's context
    const engineEffect = Effect.gen(function* () {
      const engineClient = yield* AnalysisEngineClient;
      const allEngines = yield* engineClient('engine_list', undefined);

      const originalEngine = allEngines.find(
        (engine) => engine.quizId === originalQuizId && engine.isTemp === false,
      );

      if (originalEngine === undefined) {
        return undefined;
      }

      // Clean up any existing temp engines for this temp quiz
      const existingTempEngines = allEngines.filter(
        (engine) => engine.quizId === tempQuiz.id && engine.isTemp === true,
      );
      for (const existingEngine of existingTempEngines) {
        yield* engineClient('engine_delete', { id: existingEngine.id });
        get.set(enginesAtom, EngineAction.Delete({ id: existingEngine.id }));
      }

      // Create a temp engine linked to the temp quiz
      // UpsertAnalysisEnginePayload expects scoringConfig and endings as JSON strings
      const rawEngineInput = {
        name: `${originalEngine.name} (Editing)`,
        quizId: tempQuiz.id,
        version: originalEngine.version,
        description: originalEngine.description ?? undefined,
        scoringConfig: JSON.stringify(originalEngine.scoringConfig),
        endings: JSON.stringify(originalEngine.endings),
        metadata: originalEngine.metadata ? JSON.stringify(originalEngine.metadata) : undefined,
        isActive: originalEngine.isActive,
        isPublished: false,
        isTemp: true,
      };
      const engineInput = Schema.decodeUnknownSync(UpsertAnalysisEnginePayload)(rawEngineInput);

      const tempEngine = yield* engineClient('engine_upsert', {
        input: engineInput,
      });

      get.set(enginesAtom, EngineAction.Upsert({ engine: tempEngine }));
      return tempEngine;
    }).pipe(Effect.provide(AnalysisEngineClient.layer));

    return yield* engineEffect;
  }),
);
