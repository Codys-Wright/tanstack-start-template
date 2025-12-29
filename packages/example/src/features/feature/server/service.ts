import * as Effect from 'effect/Effect';
import { FeatureRepository } from '../database';
import type { CreateFeatureInput, FeatureId, UpdateFeatureInput } from '../domain';

export class FeatureService extends Effect.Service<FeatureService>()('FeatureService', {
  dependencies: [FeatureRepository.Default],
  effect: Effect.gen(function* () {
    const repo = yield* FeatureRepository;

    return {
      list: () => repo.list(),
      getById: (id: FeatureId) => repo.getById(id),
      create: (input: CreateFeatureInput) => repo.create(input),
      update: (id: FeatureId, input: UpdateFeatureInput) => repo.update(id, input),
      remove: (id: FeatureId) => repo.remove(id),
    } as const;
  }),
}) {}
