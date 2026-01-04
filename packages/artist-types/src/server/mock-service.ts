/**
 * Mock Artist Type Service
 *
 * Server-side service that returns artist type data directly from JSON seed data.
 * Used for development, testing, or when the database is not available.
 */

import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import { ArtistTypeNotFoundError, ArtistTypeId } from '../domain/schema.js';
import type { ArtistType, ArtistTypeSeedData } from '../domain/schema.js';
import {
  getAllArtistTypeSeedData,
  getArtistTypeSeedData,
  getArtistTypeSeedDataBySlug,
} from '../database/data/index.js';

const transformSeedDataToArtistType = (seed: ArtistTypeSeedData, now: DateTime.Utc): ArtistType => {
  const metadata = {
    strengths: seed.metadata.strengths,
    challenges: seed.metadata.challenges,
    idealCollaborators: seed.metadata.idealCollaborators ?? undefined,
    recommendedPractices: seed.metadata.recommendedPractices ?? undefined,
    careerPaths: seed.metadata.careerPaths ?? undefined,
    colorPalette: seed.metadata.colorPalette ?? undefined,
    relatedTypes: seed.metadata.relatedTypes ?? undefined,
  };

  return {
    id: seed.id as ArtistTypeId,
    name: seed.name,
    shortName: seed.shortName,
    abbreviation: seed.abbreviation,
    order: seed.order,
    icon: seed.icon,
    coinIcon: seed.coinIcon ?? undefined,
    subtitle: seed.subtitle,
    elevatorPitch: seed.elevatorPitch,
    shortDescription: seed.shortDescription,
    longDescription: seed.longDescription,
    metadata,
    notes: seed.notes ?? undefined,
    createdAt: now,
    updatedAt: now,
  };
};

export class ArtistTypeMockService extends Effect.Service<ArtistTypeMockService>()(
  'ArtistTypeMockService',
  {
    effect: Effect.gen(function* () {
      const now = DateTime.unsafeNow();

      return {
        list: Effect.fn('ArtistTypeMockService.list')(function* () {
          const seedData = yield* Effect.promise(() => getAllArtistTypeSeedData());
          return seedData.map((seed) => transformSeedDataToArtistType(seed, now));
        }),

        getById: Effect.fn('ArtistTypeMockService.getById')(function* (id: string) {
          const seed = yield* Effect.promise(() => getArtistTypeSeedData(id));
          if (seed === null) {
            return new ArtistTypeNotFoundError({ id });
          }
          return transformSeedDataToArtistType(seed, now);
        }),

        getBySlug: Effect.fn('ArtistTypeMockService.getBySlug')(function* (slug: string) {
          const seed = yield* Effect.promise(() => getArtistTypeSeedDataBySlug(slug));
          if (seed === null) {
            return new ArtistTypeNotFoundError({ id: slug });
          }
          return transformSeedDataToArtistType(seed, now);
        }),
      } as const;
    }),
  },
) {}
