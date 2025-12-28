import { EnginesClient } from './features/engines/client.js';
import { Data, Effect } from 'effect';

const EngineSchema = any;

// ============================================================================
// Query Atoms
// ============================================================================

type EngineCacheUpdate = Data.TaggedEnum<{
  Upsert: { readonly engine: any };
}>;

/**
 * Main engines atom with SSR support and optimistic updates.
 */
export const enginesAtom = (() => {
  const remoteAtom = EnginesClient.runtime.atom(Effect.succeed([] as ReadonlyArray<any>));

  return Object.assign(
    Atom.writable(
      (get) => get(remoteAtom),
      (ctx, update: EngineCacheUpdate) => {
        const current = ctx.get(enginesAtom);
        if (!Result.isSuccess(current)) return;

        const nextValue = (() => {
          switch (update._tag) {
            case 'Upsert': {
              const existingIndex = EffectArray.findFirstIndex(
                current.value,
                (e) => e.id === update.engine.id,
              );
              return EffectArray.replace(
                current.value,
                existingIndex.getOrElse(() => 0),
                update.engine,
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
