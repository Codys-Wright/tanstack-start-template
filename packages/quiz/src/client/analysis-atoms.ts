import { AnalysisClient } from './features/analysis/client.js';
import { Data, Effect, Array as EffectArray } from 'effect';
import type { AnalysisResult } from './features/analysis/schema.js';

const AnalysisSchema = AnalysisResult;

// ============================================================================
// Query Atoms
// ============================================================================

type AnalysisCacheUpdate = Data.TaggedEnum<{
  Upsert: { readonly analysis: AnalysisResult };
}>;

/**
 * Main analysis atom with SSR support and optimistic updates.
 */
export const analysisAtom = (() => {
  const remoteAtom = AnalysisClient.runtime.atom(
    Effect.succeed([] as ReadonlyArray<AnalysisResult>),
  );

  return Object.assign(
    Atom.writable(
      (get) => get(remoteAtom),
      (ctx, update: AnalysisCacheUpdate) => {
        const current = ctx.get(analysisAtom);
        if (!Result.isSuccess(current)) return;

        const nextValue = (() => {
          switch (update._tag) {
            case 'Upsert': {
              const existingIndex = EffectArray.findFirstIndex(
                current.value,
                (t) => t.id === update.analysis.id,
              );
              return EffectArray.replace(
                current.value,
                existingIndex.getOrElse(() => 0),
                update.analysis,
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
