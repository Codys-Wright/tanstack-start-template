import * as Effect from 'effect/Effect';
import { ArtistTypesRepo } from '../database/index.js';
import type { ArtistTypeId } from '../domain/schema.js';
import { ArtistTypeNotFoundError } from '../domain/schema.js';

export class ArtistTypeService extends Effect.Service<ArtistTypeService>()('ArtistTypeService', {
  dependencies: [ArtistTypesRepo.Default],
  effect: Effect.gen(function* () {
    const repo = yield* ArtistTypesRepo;

    return {
      list: Effect.fn('ArtistTypeService.list')(function* () {
        return yield* repo.findAll();
      }),

      getById: Effect.fn('ArtistTypeService.getById')(function* (id: ArtistTypeId) {
        return yield* repo.findById(id);
      }),

      getBySlug: Effect.fn('ArtistTypeService.getBySlug')(function* (slug: string) {
        const normalizedSlug =
          slug.startsWith('the-') && slug.endsWith('-artist')
            ? slug
            : `the-${slug.toLowerCase()}-artist`;
        return yield* repo.findById(normalizedSlug as ArtistTypeId);
      }),
    } as const;
  }),
}) {}
