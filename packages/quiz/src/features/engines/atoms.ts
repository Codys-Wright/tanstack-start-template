import { ApiClient, makeAtomRuntime, withToast } from '@core/client';
import type { Version } from '@core/domain';
import { Atom, Registry, Result } from '@effect-atom/atom-react';
import type {
  AnalysisEngine,
  AnalysisEngineId,
  UpsertAnalysisEnginePayload,
} from '../analysis/analysis-engine/schema.js';
import { Data, Effect, Array as EffectArray } from 'effect';

const runtime = makeAtomRuntime(ApiClient.Default);

const remoteAtom = runtime.atom(
  Effect.fn(function* () {
    const api = yield* ApiClient;
    return yield* api.http.AnalysisEngine.list();
  }),
);

export type EngineAction = Data.TaggedEnum<{
  Upsert: { readonly engine: AnalysisEngine };
  Del: { readonly id: AnalysisEngineId };
}>;
export const EngineAction = Data.taggedEnum<EngineAction>();

// Keep the internal Action for backward compatibility
type Action = EngineAction;
const Action = EngineAction;

export const enginesAtom = Object.assign(
  Atom.writable(
    (get: Atom.Context) => get(remoteAtom),
    (ctx, action: Action) => {
      const result = ctx.get(enginesAtom);
      if (!Result.isSuccess(result)) return;

      const update = Action.$match(action, {
        Del: ({ id }) => result.value.filter((engine) => engine.id !== id),
        Upsert: ({ engine }) => {
          const existing = result.value.find((e) => e.id === engine.id);
          if (existing !== undefined)
            return result.value.map((e) => (e.id === engine.id ? engine : e));
          return EffectArray.prepend(result.value, engine);
        },
      });

      ctx.setSelf(Result.success(update));
    },
  ),
  {
    remote: remoteAtom,
  },
);

export const upsertEngineAtom = runtime.fn(
  Effect.fn(
    function* (payload: UpsertAnalysisEnginePayload) {
      const registry = yield* Registry.AtomRegistry;
      const api = yield* ApiClient;

      const engine = yield* api.http.AnalysisEngine.upsert({ payload });
      registry.set(enginesAtom, Action.Upsert({ engine }));
    },
    withToast({
      onWaiting: (payload) => `${payload.name !== '' ? 'Updating' : 'Creating'} analysis engine...`,
      onSuccess: 'Analysis engine saved',
      onFailure: 'Failed to save analysis engine',
    }),
  ),
);

export const deleteEngineAtom = runtime.fn(
  Effect.fn(
    function* (id: AnalysisEngineId) {
      const registry = yield* Registry.AtomRegistry;
      const api = yield* ApiClient;
      yield* api.http.AnalysisEngine.delete({ payload: { id } });
      registry.set(enginesAtom, Action.Del({ id }));
    },
    withToast({
      onWaiting: 'Deleting analysis engine...',
      onSuccess: 'Analysis engine deleted',
      onFailure: 'Failed to delete analysis engine',
    }),
  ),
);

export const getEngineByIdAtom = runtime.fn(
  Effect.fn(
    function* (id: AnalysisEngineId) {
      const api = yield* ApiClient;
      return yield* api.http.AnalysisEngine.byId({ payload: { id } });
    },
    withToast({
      onWaiting: 'Loading analysis engine...',
      onSuccess: 'Analysis engine loaded',
      onFailure: 'Failed to load analysis engine',
    }),
  ),
);

// Note: Slug-based engine lookups removed - use ActiveQuiz architecture instead

// Helper function to toggle engine publishing status
export const toggleEnginePublishAtom = runtime.fn(
  Effect.fn(
    function* (args: { engine: AnalysisEngine; isPublished: boolean }) {
      const { engine, isPublished } = args;
      const registry = yield* Registry.AtomRegistry;
      const api = yield* ApiClient;

      const updatedEngine = yield* api.http.AnalysisEngine.upsert({
        payload: {
          id: engine.id,
          name: engine.name,
          description: engine.description ?? undefined,
          scoringConfig: engine.scoringConfig,
          endings: engine.endings,
          metadata: engine.metadata ?? undefined,
          isActive: engine.isActive,
          isPublished, // Toggle published status
          isTemp: engine.isTemp, // Preserve temp status
          version: engine.version,
          quizId: engine.quizId, // Preserve quiz link
        },
      });

      registry.set(enginesAtom, Action.Upsert({ engine: updatedEngine }));
      return updatedEngine;
    },
    withToast({
      onWaiting: (args) => `${args.isPublished === true ? 'Publishing' : 'Unpublishing'} engine...`,
      onSuccess: (args) =>
        `Engine ${args.isPublished === true ? 'published' : 'unpublished'} successfully`,
      onFailure: 'Failed to update engine publishing status',
    }),
  ),
);

// Helper function to create a new engine version
export const createNewEngineVersionAtom = runtime.fn(
  Effect.fn(
    function* (args: { engine: AnalysisEngine; newVersion: Version }) {
      const { engine, newVersion } = args;
      const registry = yield* Registry.AtomRegistry;
      const api = yield* ApiClient;

      const newEngine = yield* api.http.AnalysisEngine.upsert({
        payload: {
          // Don't include id to create a new engine
          name: engine.name,
          description: engine.description ?? undefined,
          scoringConfig: engine.scoringConfig,
          endings: engine.endings,
          metadata: engine.metadata ?? undefined,
          isActive: engine.isActive,
          isPublished: false, // New versions start as drafts
          isTemp: false, // New versions are permanent
          version: newVersion,
          quizId: engine.quizId, // Preserve quiz link
        },
      });

      registry.set(enginesAtom, Action.Upsert({ engine: newEngine }));
      return newEngine;
    },
    withToast({
      onWaiting: 'Creating new engine version...',
      onSuccess: 'New engine version created successfully',
      onFailure: 'Failed to create new engine version',
    }),
  ),
);

// Helper function to create a temporary engine copy for editing
export const createTempEngineAtom = runtime.fn(
  Effect.fn(
    function* (args: { engine: AnalysisEngine }) {
      const { engine } = args;
      const registry = yield* Registry.AtomRegistry;
      const api = yield* ApiClient;

      // Create temporary copy for editing
      const tempEngine = yield* api.http.AnalysisEngine.upsert({
        payload: {
          // Don't include id to create a new engine
          name: `${engine.name} (Editing)`,
          description: engine.description ?? undefined,
          scoringConfig: engine.scoringConfig,
          endings: engine.endings,
          metadata: engine.metadata ?? undefined,
          isActive: engine.isActive,
          isPublished: false, // Temp engines are never published
          isTemp: true, // Mark as temporary
          version: engine.version,
          quizId: engine.quizId, // Preserve quiz link
        },
      });

      registry.set(enginesAtom, Action.Upsert({ engine: tempEngine }));
      return tempEngine;
    },
    withToast({
      onWaiting: 'Creating temporary copy...',
      onSuccess: 'Ready to edit',
      onFailure: 'Failed to create temporary copy',
    }),
  ),
);

// Helper function to auto-save changes to a temporary engine (no toast notifications)
export const autoSaveTempEngineAtom = runtime.fn(
  Effect.fn(
    function* (args: { engine: AnalysisEngine }) {
      const { engine } = args;
      const registry = yield* Registry.AtomRegistry;
      const api = yield* ApiClient;

      // Only work with temporary engines
      if (engine.isTemp !== true) return engine;

      const updatedEngine = yield* api.http.AnalysisEngine.upsert({
        payload: {
          id: engine.id,
          name: engine.name,
          description: engine.description ?? undefined,
          scoringConfig: engine.scoringConfig,
          endings: engine.endings,
          metadata: engine.metadata ?? undefined,
          isActive: engine.isActive,
          isPublished: engine.isPublished,
          isTemp: engine.isTemp,
          version: engine.version,
          quizId: engine.quizId, // Preserve quiz link
        },
      });

      registry.set(enginesAtom, Action.Upsert({ engine: updatedEngine }));
      return updatedEngine;
    },
    // No toast for auto-save to avoid spam
  ),
);

// Clear all temporary engines
export const clearTempEnginesAtom = runtime.fn(
  Effect.fn(function* () {
    const registry = yield* Registry.AtomRegistry;
    const api = yield* ApiClient;

    // Get all engines
    const allEngines = yield* api.http.AnalysisEngine.list();

    // Find all temp engines
    const tempEngines = allEngines.filter((engine) => engine.isTemp === true);

    // Delete all temp engines
    yield* Effect.forEach(tempEngines, (engine) =>
      api.http.AnalysisEngine.delete({ payload: { id: engine.id } }),
    );

    // Update the atom to remove deleted engines
    for (const engine of tempEngines) {
      registry.set(enginesAtom, Action.Del({ id: engine.id }));
    }

    return tempEngines.length;
  }),
);
