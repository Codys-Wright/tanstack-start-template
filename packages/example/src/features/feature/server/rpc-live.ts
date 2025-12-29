import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { FeatureRpc } from '../domain/index';
import { FeatureService } from './service';

export const FeatureRpcLive = FeatureRpc.toLayer(
  Effect.gen(function* () {
    const features = yield* FeatureService;

    return FeatureRpc.of({
      feature_list: Effect.fn(function* () {
        yield* Effect.log(`[RPC] Listing features`);
        return yield* features.list();
      }),

      feature_getById: Effect.fn(function* ({ id }) {
        yield* Effect.log(`[RPC] Getting feature ${id}`);
        return yield* features.getById(id);
      }),

      feature_create: Effect.fn(function* ({ input }) {
        yield* Effect.log(`[RPC] Creating feature "${input.name}"`);
        return yield* features.create(input);
      }),

      feature_update: Effect.fn(function* ({ id, input }) {
        yield* Effect.log(`[RPC] Updating feature ${id}`);
        return yield* features.update(id, input);
      }),

      feature_remove: Effect.fn(function* ({ id }) {
        yield* Effect.log(`[RPC] Removing feature ${id}`);
        return yield* features.remove(id);
      }),
    });
  }),
).pipe(Layer.provide(FeatureService.Default));
