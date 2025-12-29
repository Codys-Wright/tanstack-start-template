import { serializable } from '@core/client/atom-utils';
import { Atom, Result } from '@effect-atom/atom-react';
import * as RpcClientError from '@effect/rpc/RpcClientError';
import * as Arr from 'effect/Array';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import { AnalysisEngine, AnalysisEngineId, UpsertAnalysisEnginePayload } from '../domain/index.js';
import { AnalysisEngineClient } from './client.js';

const EnginesSchema = Schema.Array(AnalysisEngine);

// ============================================================================
// Query Atoms
// ============================================================================

type EnginesCacheUpdate = Data.TaggedEnum<{
  Upsert: { readonly engine: AnalysisEngine };
  Delete: { readonly id: AnalysisEngineId };
}>;

// Export EngineAction for optimistic updates
export const EngineAction = Data.taggedEnum<EnginesCacheUpdate>();

/**
 * Main engines atom with SSR support and optimistic updates.
 */
export const enginesAtom = (() => {
  // Remote atom that fetches from the RPC
  const remoteAtom = AnalysisEngineClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* AnalysisEngineClient;
        return yield* client('engine_list', undefined);
      }),
    )
    .pipe(
      serializable({
        key: '@quiz/engines',
        schema: Result.Schema({
          success: EnginesSchema,
          error: RpcClientError.RpcClientError,
        }),
      }),
    );

  // Writable atom with local cache updates
  return Object.assign(
    Atom.writable(
      (get) => get(remoteAtom),
      (ctx, update: EnginesCacheUpdate) => {
        const current = ctx.get(enginesAtom);
        if (!Result.isSuccess(current)) return;

        const nextValue = (() => {
          switch (update._tag) {
            case 'Upsert': {
              const existingIndex = Arr.findFirstIndex(
                current.value,
                (e) => e.id === update.engine.id,
              );
              return Option.match(existingIndex, {
                onNone: () => Arr.prepend(current.value, update.engine),
                onSome: (index) => Arr.replace(current.value, index, update.engine),
              });
            }
            case 'Delete': {
              return Arr.filter(current.value, (e) => e.id !== update.id);
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
 * Upsert engine with optimistic cache update.
 */
export const upsertEngineAtom = AnalysisEngineClient.runtime.fn<{
  input: UpsertAnalysisEnginePayload;
}>()(
  Effect.fnUntraced(function* ({ input }, get) {
    const client = yield* AnalysisEngineClient;
    const result = yield* client('engine_upsert', { input });
    get.set(enginesAtom, { _tag: 'Upsert', engine: result });
    return result;
  }),
);

/**
 * Delete engine with optimistic cache update.
 */
export const deleteEngineAtom = AnalysisEngineClient.runtime.fn<AnalysisEngineId>()(
  Effect.fnUntraced(function* (id, get) {
    const client = yield* AnalysisEngineClient;
    yield* client('engine_delete', { id });
    get.set(enginesAtom, { _tag: 'Delete', id });
  }),
);

/**
 * Get engine by ID.
 */
export const getEngineByIdAtom = AnalysisEngineClient.runtime.fn<AnalysisEngineId>()(
  Effect.fnUntraced(function* (id) {
    const client = yield* AnalysisEngineClient;
    return yield* client('engine_getById', { id });
  }),
);

/**
 * Get published engines only.
 */
export const publishedEnginesAtom = (() => {
  const remoteAtom = AnalysisEngineClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* AnalysisEngineClient;
        return yield* client('engine_listPublished', undefined);
      }),
    )
    .pipe(
      serializable({
        key: '@quiz/engines-published',
        schema: Result.Schema({
          success: EnginesSchema,
          error: RpcClientError.RpcClientError,
        }),
      }),
    );

  return Object.assign(
    Atom.readable((get) => get(remoteAtom)),
    { remote: remoteAtom },
  );
})();

/**
 * Derived atom to get the first active engine (commonly used for quiz analysis).
 */
export const activeEngineAtom = Atom.make((get) => {
  const enginesResult = get(enginesAtom);
  if (!Result.isSuccess(enginesResult)) return undefined;
  return enginesResult.value.find((engine) => engine.isActive);
});

/**
 * Auto-save temporary engine changes (silent, no toast).
 */
export const autoSaveTempEngineAtom = AnalysisEngineClient.runtime.fn<{
  engine: AnalysisEngine;
}>()(
  Effect.fnUntraced(function* (args, get) {
    const { engine } = args;
    const client = yield* AnalysisEngineClient;

    if (!engine.isTemp) return engine;

    const updatedEngine = yield* client('engine_upsert', {
      input: {
        id: engine.id,
        name: engine.name,
        quizId: engine.quizId,
        version: engine.version,
        description: engine.description ?? undefined,
        scoringConfig: engine.scoringConfig,
        endings: engine.endings,
        metadata: engine.metadata ?? undefined,
        isActive: engine.isActive,
        isPublished: false,
        isTemp: true,
      },
    });

    get.set(enginesAtom, { _tag: 'Upsert', engine: updatedEngine });
    return updatedEngine;
  }),
);

/**
 * Clear all temporary engines.
 */
export const clearTempEnginesAtom = AnalysisEngineClient.runtime.fn<void>()(
  Effect.fnUntraced(function* (_, get) {
    const client = yield* AnalysisEngineClient;

    const enginesResult = get(enginesAtom);
    if (!Result.isSuccess(enginesResult)) return 0;

    const tempEngines = enginesResult.value.filter((e) => e.isTemp === true);

    yield* Effect.forEach(tempEngines, (engine) => client('engine_delete', { id: engine.id }));

    for (const engine of tempEngines) {
      get.set(enginesAtom, { _tag: 'Delete', id: engine.id });
    }

    return tempEngines.length;
  }),
);
