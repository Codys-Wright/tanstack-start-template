import * as HttpApiBuilder from '@effect/platform/HttpApiBuilder';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { ExampleApi } from '../../../core/server/api';
import { FeatureService } from './service';

/**
 * FeatureApiLive - HTTP API handlers for the features group.
 *
 * Uses ExampleApi (the package-level HttpApi) to implement handlers.
 * The handlers are provided to ExampleHttpLive layer for composition.
 *
 * @example
 * ```ts
 * import { ExampleHttpLive } from "@example/server";
 * import * as HttpLayerRouter from "@effect/platform/HttpLayerRouter";
 *
 * const Routes = HttpLayerRouter.addHttpApi(DomainApi).pipe(
 *   Layer.provide(ExampleHttpLive)
 * );
 * ```
 */
export const FeatureApiLive = HttpApiBuilder.group(ExampleApi, 'features', (handlers) =>
  handlers
    .handle('list', () =>
      Effect.gen(function* () {
        yield* Effect.log(`[HTTP API] Listing features`);
        const features = yield* FeatureService;
        return yield* features.list();
      }),
    )
    .handle('getById', ({ path }) =>
      Effect.gen(function* () {
        yield* Effect.log(`[HTTP API] Getting feature ${path.id}`);
        const features = yield* FeatureService;
        return yield* features.getById(path.id);
      }),
    )
    .handle('create', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log(`[HTTP API] Creating feature`);
        const features = yield* FeatureService;
        return yield* features.create(payload);
      }),
    )
    .handle('update', ({ path, payload }) =>
      Effect.gen(function* () {
        yield* Effect.log(`[HTTP API] Updating feature ${path.id}`);
        const features = yield* FeatureService;
        return yield* features.update(path.id, payload);
      }),
    )
    .handle('remove', ({ path }) =>
      Effect.gen(function* () {
        yield* Effect.log(`[HTTP API] Removing feature ${path.id}`);
        const features = yield* FeatureService;
        return yield* features.remove(path.id);
      }),
    ),
).pipe(Layer.provide(FeatureService.Default));
