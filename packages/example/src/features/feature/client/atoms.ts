import { serializable } from '@core/client/atom-utils';
import { Atom, Result } from '@effect-atom/atom-react';
import * as RpcClientError from '@effect/rpc/RpcClientError';
import * as Arr from 'effect/Array';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as S from 'effect/Schema';
import { CreateFeatureInput, Feature, FeatureId, UpdateFeatureInput } from '../domain/index.js';
import { FeatureClient } from './client.js';

const FeaturesSchema = S.Array(Feature);

// ============================================================================
// Query Atoms
// ============================================================================

type FeaturesCacheUpdate = Data.TaggedEnum<{
  Upsert: { readonly feature: Feature };
  Delete: { readonly id: FeatureId };
}>;

/**
 * Main features atom with SSR support and optimistic updates.
 *
 * Uses runtime.atom() pattern from reference implementation for full control
 * over the Effect pipeline and proper error type inference.
 */
export const featuresAtom = (() => {
  // Remote atom that fetches from the RPC
  const remoteAtom = FeatureClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* FeatureClient;
        return yield* client('feature_list', undefined);
      }),
    )
    .pipe(
      serializable({
        key: '@example/features',
        schema: Result.Schema({
          success: FeaturesSchema,
          error: RpcClientError.RpcClientError,
        }),
      }),
    );

  // Writable atom with local cache updates
  return Object.assign(
    Atom.writable(
      (get) => get(remoteAtom),
      (ctx, update: FeaturesCacheUpdate) => {
        const current = ctx.get(featuresAtom);
        if (!Result.isSuccess(current)) return;

        const nextValue = (() => {
          switch (update._tag) {
            case 'Upsert': {
              const existingIndex = Arr.findFirstIndex(
                current.value,
                (f) => f.id === update.feature.id,
              );
              return Option.match(existingIndex, {
                onNone: () => Arr.prepend(current.value, update.feature),
                onSome: (index) => Arr.replace(current.value, index, update.feature),
              });
            }
            case 'Delete': {
              return Arr.filter(current.value, (f) => f.id !== update.id);
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
 * Create feature with optimistic cache update.
 */
export const createFeatureAtom = FeatureClient.runtime.fn<CreateFeatureInput>()(
  Effect.fnUntraced(function* (input, get) {
    const client = yield* FeatureClient;
    const result = yield* client('feature_create', { input });
    get.set(featuresAtom, { _tag: 'Upsert', feature: result });
    return result;
  }),
);

/**
 * Update feature with optimistic cache update.
 */
export const updateFeatureAtom = FeatureClient.runtime.fn<{
  readonly id: FeatureId;
  readonly input: UpdateFeatureInput;
}>()(
  Effect.fnUntraced(function* ({ id, input }, get) {
    const client = yield* FeatureClient;
    const result = yield* client('feature_update', { id, input });
    get.set(featuresAtom, { _tag: 'Upsert', feature: result });
    return result;
  }),
);

/**
 * Delete feature with optimistic cache update.
 */
export const deleteFeatureAtom = FeatureClient.runtime.fn<FeatureId>()(
  Effect.fnUntraced(function* (id, get) {
    const client = yield* FeatureClient;
    yield* client('feature_remove', { id });
    get.set(featuresAtom, { _tag: 'Delete', id });
  }),
);
