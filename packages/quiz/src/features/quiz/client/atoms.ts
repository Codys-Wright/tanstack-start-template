import { ApiClient, makeAtomRuntime, withToast } from '@core/client';
import type { Version } from '@core/domain';
import { Atom, Registry, Result } from '@effect-atom/atom-react';
import type { ActiveQuiz, ActiveQuizId, UpsertActiveQuizPayload } from '../active-quiz/schema.js';
import type { Quiz, QuizId, UpsertQuizPayload } from './schema.js';
import { Data, Effect, Array as EffectArray } from 'effect';
import { EngineAction, enginesAtom } from '../engines/atoms.js';

const runtime = makeAtomRuntime(ApiClient.Default);

const remoteAtom = runtime.atom(
  Effect.fn(function* () {
    const api = yield* ApiClient;
    return yield* api.http.Quizzes.list();
  }),
);

type Action = Data.TaggedEnum<{
  Upsert: { readonly quiz: Quiz };
  Del: { readonly id: QuizId };
}>;
const Action = Data.taggedEnum<Action>();

export const quizzesAtom = Object.assign(
  Atom.writable(
    (get: Atom.Context) => get(remoteAtom),
    (ctx, action: Action) => {
      const result = ctx.get(quizzesAtom);
      if (!Result.isSuccess(result)) return;

      const update = Action.$match(action, {
        Del: ({ id }) => result.value.filter((quiz) => quiz.id !== id),
        Upsert: ({ quiz }) => {
          const existing = result.value.find((q) => q.id === quiz.id);
          if (existing !== undefined) return result.value.map((q) => (q.id === quiz.id ? quiz : q));
          return EffectArray.prepend(result.value, quiz);
        },
      });

      ctx.setSelf(Result.success(update));
    },
  ),
  {
    remote: remoteAtom,
  },
);

export const upsertQuizAtom = runtime.fn(
  Effect.fn(
    function* (payload: UpsertQuizPayload) {
      const registry = yield* Registry.AtomRegistry;
      const api = yield* ApiClient;

      const quiz = yield* api.http.Quizzes.upsert({ payload });
      registry.set(quizzesAtom, Action.Upsert({ quiz }));
    },
    withToast({
      onWaiting: (payload) => `${payload.id !== undefined ? 'Updating' : 'Creating'} quiz...`,
      onSuccess: 'Quiz saved',
      onFailure: 'Failed to save quiz',
    }),
  ),
);

export const deleteQuizAtom = runtime.fn(
  Effect.fn(
    function* (id: QuizId) {
      const registry = yield* Registry.AtomRegistry;
      const api = yield* ApiClient;
      yield* api.http.Quizzes.delete({ payload: { id } });
      registry.set(quizzesAtom, Action.Del({ id }));
    },
    withToast({
      onWaiting: 'Deleting quiz...',
      onSuccess: 'Quiz deleted',
      onFailure: 'Failed to delete quiz',
    }),
  ),
);

// Helper function to publish/unpublish a quiz using upsert
export const toggleQuizPublishAtom = runtime.fn(
  Effect.fn(
    function* (args: { quiz: Quiz; isPublished: boolean }) {
      const { isPublished, quiz } = args;
      const registry = yield* Registry.AtomRegistry;
      const api = yield* ApiClient;
      const updatedQuiz = yield* api.http.Quizzes.upsert({
        payload: {
          id: quiz.id,
          isPublished,
          isTemp: quiz.isTemp, // Preserve temp status
          metadata: quiz.metadata ?? undefined,
          questions: quiz.questions,
          title: quiz.title,
          subtitle: quiz.subtitle,
          description: quiz.description,
          version: quiz.version,
        },
      });
      registry.set(quizzesAtom, Action.Upsert({ quiz: updatedQuiz }));
    },
    withToast({
      onWaiting: (args) =>
        args.isPublished === true ? 'Publishing quiz...' : 'Unpublishing quiz...',
      onSuccess: 'Quiz publish status updated',
      onFailure: 'Failed to update quiz publish status',
    }),
  ),
);

// Helper function to create a new version of a quiz
export const createNewQuizVersionAtom = runtime.fn(
  Effect.fn(
    function* (args: {
      quiz: Quiz;
      newVersion: Version;
      incrementType: 'major' | 'minor' | 'patch';
    }) {
      const { newVersion, quiz } = args;
      const registry = yield* Registry.AtomRegistry;
      const api = yield* ApiClient;

      // Create new version as draft (isPublished: false)
      const newQuiz = yield* api.http.Quizzes.upsert({
        payload: {
          // Don't include id to create a new quiz
          description: quiz.description,
          isPublished: false, // New versions start as drafts
          isTemp: false, // New versions are permanent (not temporary)
          metadata: quiz.metadata ?? undefined,
          questions: quiz.questions,
          subtitle: quiz.subtitle,
          title: quiz.title,
          version: newVersion,
        },
      });

      registry.set(quizzesAtom, Action.Upsert({ quiz: newQuiz }));

      // Also create a matching analysis engine version
      try {
        // Find the original analysis engine (linked to the original quiz)
        const allEngines = yield* api.http.AnalysisEngine.list();
        const originalEngine = allEngines.find(
          (engine) => engine.quizId === quiz.id && engine.isTemp === false,
        );

        if (originalEngine !== undefined) {
          // Create new engine version based on the original
          yield* api.http.AnalysisEngine.upsert({
            payload: {
              name: originalEngine.name, // Keep same name
              quizId: newQuiz.id, // Reference the new quiz version!
              version: newVersion, // Use the new version to match quiz
              description: originalEngine.description ?? undefined,
              scoringConfig: originalEngine.scoringConfig,
              endings: originalEngine.endings,
              metadata: originalEngine.metadata ?? undefined,
              isActive: originalEngine.isActive,
              isPublished: false, // New versions start as drafts
              isTemp: false, // New versions are permanent
            },
          });
        }
      } catch {
        // Silently ignore engine creation failures
      }

      return newQuiz;
    },
    withToast({
      onWaiting: 'Creating new version...',
      onSuccess: 'Created new version successfully',
      onFailure: 'Failed to create new version',
    }),
  ),
);

// Helper function to create a temporary quiz for editing
export const createTempQuizAtom = runtime.fn(
  Effect.fn(
    function* (args: { quiz: Quiz }) {
      const { quiz } = args;
      const registry = yield* Registry.AtomRegistry;
      const api = yield* ApiClient;

      // Create temporary copy for editing
      const tempQuiz = yield* api.http.Quizzes.upsert({
        payload: {
          // Don't include id to create a new quiz
          description: quiz.description,
          isPublished: false, // Temp quizzes are never published
          isTemp: true, // Mark as temporary
          metadata: quiz.metadata ?? undefined,
          questions: quiz.questions,
          subtitle: quiz.subtitle,
          title: `${quiz.title} (Editing)`,
          version: quiz.version,
        },
      });

      registry.set(quizzesAtom, Action.Upsert({ quiz: tempQuiz }));

      // Automatically create matching analysis engine
      // Find the original analysis engine (linked to the original quiz)
      const allEngines = yield* api.http.AnalysisEngine.list();

      // Look for engines that match the original quiz ID
      const originalEngine = allEngines.find(
        (engine) => engine.quizId === quiz.id && engine.isTemp === false,
      );

      if (originalEngine !== undefined) {
        try {
          // First, clean up any existing temp engines for this quiz to avoid conflicts
          const existingTempEngines = allEngines.filter(
            (engine) => engine.quizId === tempQuiz.id && engine.isTemp === true,
          );

          for (const existingEngine of existingTempEngines) {
            try {
              yield* api.http.AnalysisEngine.delete({
                payload: { id: existingEngine.id },
              });
              registry.set(enginesAtom, EngineAction.Del({ id: existingEngine.id }));
              // Old temp engine cleaned up
            } catch {
              // Silently ignore cleanup failures
            }
          }

          // Create temp engine based on original
          const tempEngine = yield* api.http.AnalysisEngine.upsert({
            payload: {
              name: `${originalEngine.name} (Editing)`,
              quizId: tempQuiz.id, // Direct reference to the quiz!
              version: originalEngine.version,
              description: originalEngine.description ?? undefined,
              scoringConfig: originalEngine.scoringConfig,
              endings: originalEngine.endings,
              metadata: originalEngine.metadata ?? undefined,
              isActive: originalEngine.isActive,
              isPublished: false,
              isTemp: true,
            },
          });

          // Temp engine created successfully

          // Add the temp engine to the engines atom so it's immediately available
          registry.set(enginesAtom, EngineAction.Upsert({ engine: tempEngine }));

          // eslint-disable-next-line no-console
          console.log('🔧 Created temp engine for temp quiz:');
          // eslint-disable-next-line no-console
          console.log('  Temp Quiz ID:', tempQuiz.id);
          // eslint-disable-next-line no-console
          console.log('  Temp Engine ID:', tempEngine.id);
          // eslint-disable-next-line no-console
          console.log('  Engine quizId:', tempEngine.quizId);
          // eslint-disable-next-line no-console
          console.log('  Engine isTemp:', tempEngine.isTemp);
        } catch {
          // Silently ignore temp engine creation failures
        }
      } else {
        // No matching analysis engine found
      }

      return tempQuiz;
    },
    withToast({
      onWaiting: 'Creating temporary copy...',
      onSuccess: 'Ready to edit',
      onFailure: 'Failed to create temporary copy',
    }),
  ),
);

// Helper function to auto-save temporary quiz changes
export const autoSaveTempQuizAtom = runtime.fn(
  Effect.fn(
    function* (args: { quiz: Quiz }) {
      const { quiz } = args;
      const registry = yield* Registry.AtomRegistry;
      const api = yield* ApiClient;

      // Only auto-save if it's a temporary quiz
      if (!quiz.isTemp) return quiz;

      const updatedQuiz = yield* api.http.Quizzes.upsert({
        payload: {
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

      registry.set(quizzesAtom, Action.Upsert({ quiz: updatedQuiz }));
      return updatedQuiz;
    },
    // No toast for auto-save to avoid spam
  ),
);

// Helper function to save temporary quiz changes
export const saveTempQuizAtom = runtime.fn(
  Effect.fn(
    function* (
      args:
        | { quiz: Quiz; action: 'save' }
        | { quiz: Quiz; action: 'saveAsNew'; newVersion: Version },
    ) {
      const { action, quiz } = args;
      const registry = yield* Registry.AtomRegistry;
      const api = yield* ApiClient;

      // Only work with temporary quizzes
      if (!quiz.isTemp) return quiz;

      if (action === 'save') {
        // Update the temp quiz to be permanent (overwrite mode)
        const savedQuiz = yield* api.http.Quizzes.upsert({
          payload: {
            id: quiz.id,
            description: quiz.description,
            isPublished: false, // Keep as draft when saving temp changes
            isTemp: false, // Make it permanent
            metadata: quiz.metadata ?? undefined,
            questions: quiz.questions,
            subtitle: quiz.subtitle,
            title: quiz.title.replace(' (Editing)', ''), // Remove editing suffix
            version: quiz.version,
          },
        });

        registry.set(quizzesAtom, Action.Upsert({ quiz: savedQuiz }));

        // Also update the corresponding temp engine to be permanent
        const allEngines = yield* api.http.AnalysisEngine.list();
        const tempEngine = allEngines.find(
          (engine) => engine.quizId === quiz.id && engine.isTemp === true,
        );

        if (tempEngine !== undefined) {
          // Update temp engine to be permanent
          const savedEngine = yield* api.http.AnalysisEngine.upsert({
            payload: {
              id: tempEngine.id, // Update existing engine
              name: tempEngine.name.replace(' (Editing)', ''), // Remove editing suffix
              quizId: savedQuiz.id, // Link to the saved quiz
              version: savedQuiz.version, // Use the saved quiz version
              description: tempEngine.description ?? undefined,
              scoringConfig: tempEngine.scoringConfig,
              endings: tempEngine.endings,
              metadata: tempEngine.metadata ?? undefined,
              isActive: tempEngine.isActive,
              isPublished: false, // Keep as draft
              isTemp: false, // Make it permanent
            },
          });

          registry.set(enginesAtom, EngineAction.Upsert({ engine: savedEngine }));

          // eslint-disable-next-line no-console
          console.log('🔧 Updated temp engine to permanent:');
          // eslint-disable-next-line no-console
          console.log('  Saved Quiz ID:', savedQuiz.id);
          // eslint-disable-next-line no-console
          console.log('  Saved Engine ID:', savedEngine.id);
          // eslint-disable-next-line no-console
          console.log('  Engine quizId:', savedEngine.quizId);
          // eslint-disable-next-line no-console
          console.log('  Engine isTemp:', savedEngine.isTemp);
        }

        return savedQuiz;
      }

      // action === "saveAsNew"
      // Create new version from temp quiz
      const newQuiz = yield* api.http.Quizzes.upsert({
        payload: {
          // Don't include id to create a new quiz
          description: quiz.description,
          isPublished: false, // New versions start as drafts
          isTemp: false, // Make it permanent
          metadata: quiz.metadata ?? undefined,
          questions: quiz.questions,
          subtitle: quiz.subtitle,
          title: quiz.title.replace(' (Editing)', ''), // Remove editing suffix
          version: args.newVersion, // Use args.newVersion directly
        },
      });

      registry.set(quizzesAtom, Action.Upsert({ quiz: newQuiz }));

      // Create matching permanent analysis engine
      const allEngines = yield* api.http.AnalysisEngine.list();
      const tempEngine = allEngines.find(
        (engine) => engine.quizId === quiz.id && engine.isTemp === true,
      );

      if (tempEngine !== undefined) {
        // Create permanent engine based on temp engine
        const newEngine = yield* api.http.AnalysisEngine.upsert({
          payload: {
            // Don't include id to create a new engine
            name: tempEngine.name.replace(' (Editing)', ''), // Remove editing suffix
            quizId: newQuiz.id, // Link to the new permanent quiz
            version: args.newVersion, // Use the new version
            description: tempEngine.description ?? undefined,
            scoringConfig: tempEngine.scoringConfig,
            endings: tempEngine.endings,
            metadata: tempEngine.metadata ?? undefined,
            isActive: tempEngine.isActive,
            isPublished: false, // New engines start as drafts
            isTemp: false, // Make it permanent
          },
        });

        registry.set(enginesAtom, EngineAction.Upsert({ engine: newEngine }));

        // eslint-disable-next-line no-console
        console.log('🔧 Created permanent engine for new quiz version:');
        // eslint-disable-next-line no-console
        console.log('  New Quiz ID:', newQuiz.id);
        // eslint-disable-next-line no-console
        console.log('  New Engine ID:', newEngine.id);
        // eslint-disable-next-line no-console
        console.log('  Engine quizId:', newEngine.quizId);
        // eslint-disable-next-line no-console
        console.log('  Engine isTemp:', newEngine.isTemp);

        // Delete the temporary engine
        yield* api.http.AnalysisEngine.delete({
          payload: { id: tempEngine.id },
        });
        registry.set(enginesAtom, EngineAction.Del({ id: tempEngine.id }));
      }

      // Delete the temporary quiz
      yield* api.http.Quizzes.delete({ payload: { id: quiz.id } });
      registry.set(quizzesAtom, Action.Del({ id: quiz.id }));

      return newQuiz;
    },
    withToast({
      onWaiting: 'Saving quiz...',
      onSuccess: 'Quiz saved successfully',
      onFailure: 'Failed to save quiz',
    }),
  ),
);

// Create matching analysis engine for a temp quiz
export const createMatchingTempEngineAtom = runtime.fn(
  Effect.fn(function* ({ quiz }: { quiz: Quiz }) {
    const api = yield* ApiClient;

    // Only work with temp quizzes
    if (quiz.isTemp !== true) return undefined;

    // Find the original quiz that this temp quiz is based on
    const allQuizzes = yield* api.http.Quizzes.list();
    const originalQuiz = allQuizzes.find(
      (q) => q.title === quiz.title.replace(' (Editing)', '') && q.isTemp === false,
    );

    if (originalQuiz === undefined) {
      throw new Error(`No original quiz found for temp quiz: ${quiz.title}`);
    }

    // Find the original analysis engine (linked to the original quiz)
    const allEngines = yield* api.http.AnalysisEngine.list();
    const originalEngine = allEngines.find(
      (engine) => engine.quizId === originalQuiz.id && engine.isTemp === false,
    );

    if (originalEngine === undefined) {
      throw new Error(`No analysis engine found for original quiz: ${originalQuiz.title}`);
    }

    // Create temp engine based on original
    const tempEngine = yield* api.http.AnalysisEngine.upsert({
      payload: {
        name: `${originalEngine.name} (Editing)`,
        version: quiz.version,
        description: originalEngine.description ?? undefined,
        scoringConfig: originalEngine.scoringConfig,
        endings: originalEngine.endings,
        metadata: originalEngine.metadata ?? undefined,
        isActive: originalEngine.isActive,
        isPublished: false,
        isTemp: true,
        quizId: quiz.id, // Link to the temp quiz
      },
    });

    return tempEngine;
  }),
);

// Clear all temporary quizzes
export const clearTempQuizzesAtom = runtime.fn(
  Effect.fn(function* () {
    const registry = yield* Registry.AtomRegistry;
    const api = yield* ApiClient;

    // Get all quizzes
    const allQuizzes = yield* api.http.Quizzes.list();

    // Find all temp quizzes
    const tempQuizzes = allQuizzes.filter((quiz) => quiz.isTemp === true);

    // Delete all temp quizzes
    yield* Effect.forEach(tempQuizzes, (quiz) =>
      api.http.Quizzes.delete({ payload: { id: quiz.id } }),
    );

    // Update the atom to remove deleted quizzes
    for (const quiz of tempQuizzes) {
      registry.set(quizzesAtom, Action.Del({ id: quiz.id }));
    }

    return tempQuizzes.length;
  }),
);

// Active Quiz Atom - for getting the currently active "My Artist Type" quiz
const activeQuizRemoteAtom = runtime.atom(
  Effect.gen(function* () {
    const api = yield* ApiClient;
    // Get all active quizzes and find the first one (should only be one active)
    const activeQuizzes = yield* api.http.ActiveQuizzes.list();
    return activeQuizzes[0] as ActiveQuiz | undefined; // Return the first active quiz
  }),
);

export const activeQuizAtom = Object.assign(
  Atom.writable(
    (get: Atom.Context) => get(activeQuizRemoteAtom),
    (_ctx, _activeQuiz: ActiveQuiz) => {
      // Active quiz is read-only, so we don't need to handle writes
      // This is just for type compatibility
    },
  ),
  {
    remote: activeQuizRemoteAtom,
  },
);
