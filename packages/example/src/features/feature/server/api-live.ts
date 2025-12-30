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
 * Each handler uses Effect.withSpan for explicit tracing. The span hierarchy will be:
 *   http.server GET /api/example/features (HttpMiddleware.tracer)
 *     └─ FeatureApi.list (this handler)
 *         └─ FeatureService.list (service layer)
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
      Effect.withSpan(
        Effect.gen(function* () {
          yield* Effect.log(`[HTTP API] Listing features`);
          const features = yield* FeatureService;
          return yield* features.list();
        }),
        'FeatureApi.list',
      ),
    )
    .handle('getById', ({ path }) =>
      Effect.withSpan(
        Effect.gen(function* () {
          yield* Effect.annotateCurrentSpan('feature.id', path.id);
          yield* Effect.log(`[HTTP API] Getting feature ${path.id}`);
          const features = yield* FeatureService;
          return yield* features.getById(path.id);
        }),
        'FeatureApi.getById',
      ),
    )
    .handle('create', ({ payload }) =>
      Effect.withSpan(
        Effect.gen(function* () {
          yield* Effect.annotateCurrentSpan('feature.name', payload.name);
          yield* Effect.log(`[HTTP API] Creating feature`);
          const features = yield* FeatureService;
          return yield* features.create(payload);
        }),
        'FeatureApi.create',
      ),
    )
    .handle('update', ({ path, payload }) =>
      Effect.withSpan(
        Effect.gen(function* () {
          yield* Effect.annotateCurrentSpan('feature.id', path.id);
          yield* Effect.log(`[HTTP API] Updating feature ${path.id}`);
          const features = yield* FeatureService;
          return yield* features.update(path.id, payload);
        }),
        'FeatureApi.update',
      ),
    )
    .handle('remove', ({ path }) =>
      Effect.withSpan(
        Effect.gen(function* () {
          yield* Effect.annotateCurrentSpan('feature.id', path.id);
          yield* Effect.log(`[HTTP API] Removing feature ${path.id}`);
          const features = yield* FeatureService;
          return yield* features.remove(path.id);
        }),
        'FeatureApi.remove',
      ),
    ),
).pipe(Layer.provide(FeatureService.Default));
