import * as Effect from "effect/Effect";
import { FeatureRepository } from "../database";
import type {
  CreateFeatureInput,
  FeatureId,
  UpdateFeatureInput,
} from "../domain";

/**
 * FeatureService - Business logic layer for feature operations.
 *
 * All methods use Effect.fn for automatic OpenTelemetry tracing.
 * Spans are named: FeatureService.<method>
 */
export class FeatureService extends Effect.Service<FeatureService>()(
  "FeatureService",
  {
    dependencies: [FeatureRepository.Default],
    effect: Effect.gen(function* () {
      const repo = yield* FeatureRepository;

      return {
        /** List all features */
        list: Effect.fn("FeatureService.list")(function* () {
          const features = yield* repo.list();
          yield* Effect.annotateCurrentSpan("feature.count", features.length);
          yield* Effect.log("Example List Service Log");
          return features;
        }),

        /** Get feature by ID */
        getById: Effect.fn("FeatureService.getById")(function* (id: FeatureId) {
          yield* Effect.annotateCurrentSpan("feature.id", id);
          return yield* repo.getById(id);
        }),

        /** Create a new feature */
        create: Effect.fn("FeatureService.create")(function* (
          input: CreateFeatureInput,
        ) {
          yield* Effect.annotateCurrentSpan("feature.name", input.name);
          const feature = yield* repo.create(input);
          yield* Effect.annotateCurrentSpan("feature.id", feature.id);
          return feature;
        }),

        /** Update an existing feature */
        update: Effect.fn("FeatureService.update")(function* (
          id: FeatureId,
          input: UpdateFeatureInput,
        ) {
          yield* Effect.annotateCurrentSpan("feature.id", id);
          if (input.name) {
            yield* Effect.annotateCurrentSpan("feature.name", input.name);
          }
          return yield* repo.update(id, input);
        }),

        /** Remove a feature */
        remove: Effect.fn("FeatureService.remove")(function* (id: FeatureId) {
          yield* Effect.annotateCurrentSpan("feature.id", id);
          return yield* repo.remove(id);
        }),
      } as const;
    }),
  },
) {}
