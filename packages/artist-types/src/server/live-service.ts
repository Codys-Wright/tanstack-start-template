import * as Effect from 'effect/Effect';
import * as Cache from 'effect/Cache';
import * as Duration from 'effect/Duration';
import { ArtistTypesRepo } from '../database/index.js';
import type { ArtistTypeId } from '../domain/schema.js';

// Cache TTL - artist types rarely change, so cache for 5 minutes
const CACHE_TTL = Duration.minutes(5);

export class ArtistTypeService extends Effect.Service<ArtistTypeService>()('ArtistTypeService', {
  dependencies: [ArtistTypesRepo.Default],
  effect: Effect.gen(function* () {
    const repo = yield* ArtistTypesRepo;

    // Cache for list - single entry cache (void key)
    const listCache = yield* Cache.make({
      capacity: 1,
      timeToLive: CACHE_TTL,
      lookup: (_: void) =>
        repo
          .findAll()
          .pipe(
            Effect.tap(() =>
              Effect.log('[ArtistTypeService] Cache MISS - fetching all artist types'),
            ),
          ),
    });

    // Cache for individual artist types by ID
    const byIdCache = yield* Cache.make({
      capacity: 20,
      timeToLive: CACHE_TTL,
      lookup: (id: ArtistTypeId) =>
        repo
          .findById(id)
          .pipe(
            Effect.tap(() =>
              Effect.log(`[ArtistTypeService] Cache MISS - fetching artist type: ${id}`),
            ),
          ),
    });

    return {
      list: Effect.fn('ArtistTypeService.list')(function* () {
        return yield* listCache.get(undefined);
      }),

      getById: Effect.fn('ArtistTypeService.getById')(function* (id: ArtistTypeId) {
        return yield* byIdCache.get(id);
      }),

      getBySlug: Effect.fn('ArtistTypeService.getBySlug')(function* (slug: string) {
        const normalizedSlug =
          slug.startsWith('the-') && slug.endsWith('-artist')
            ? slug
            : `the-${slug.toLowerCase()}-artist`;
        return yield* byIdCache.get(normalizedSlug as ArtistTypeId);
      }),

      // Utility to invalidate caches if needed (e.g., after admin updates)
      invalidateCache: Effect.fn('ArtistTypeService.invalidateCache')(function* () {
        yield* listCache.invalidateAll;
        yield* byIdCache.invalidateAll;
        yield* Effect.log('[ArtistTypeService] Cache invalidated');
      }),
    } as const;
  }),
}) {}
