import { expect, it } from '@effect/vitest';
import * as BunContext from '@effect/platform-bun/BunContext';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as SqlClient from '@effect/sql/SqlClient';
import { makePgTestMigrations, withTransactionRollback } from '@core/database';
import { ArtistTypeMigrations } from './migrations.js';
import { ArtistTypesRepo } from './repo.js';
import type { ArtistTypeId } from '../domain/schema.js';
import { ArtistTypeNotFoundError } from '../domain/schema.js';

// Create test layer with artist-types migrations applied
const PgTest = makePgTestMigrations(ArtistTypeMigrations);

// Repository layer for tests
const TestLayer = ArtistTypesRepo.DefaultWithoutDependencies.pipe(
  Layer.provideMerge(PgTest),
  Layer.provide(BunContext.layer),
);

// Helper to create artist type test data
const createArtistTypeData = (overrides?: { id?: string; name?: string; order?: number }) => ({
  id: overrides?.id ?? 'test-artist-type',
  name: overrides?.name ?? 'Test Artist',
  shortName: 'Test',
  abbreviation: 'TA',
  order: overrides?.order ?? 1,
  icon: 'test-icon',
  coinIcon: null,
  subtitle: 'A test artist type',
  elevatorPitch: 'This is a test artist type for testing purposes.',
  shortDescription: 'Short description of the test artist type.',
  longDescription: 'A longer description that goes into more detail about the test artist type.',
  metadata: {
    strengths: ['creativity', 'innovation'],
    challenges: ['focus', 'consistency'],
  },
  notes: null,
});

// Helper to insert an artist type directly via SQL
const insertArtistType = (data: ReturnType<typeof createArtistTypeData>) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const metadata = JSON.stringify(data.metadata);
    yield* sql`
      INSERT INTO artist_types (
        id, name, short_name, abbreviation, "order", icon, coin_icon,
        subtitle, elevator_pitch, short_description, long_description,
        metadata, notes
      ) VALUES (
        ${data.id}, ${data.name}, ${data.shortName}, ${data.abbreviation},
        ${data.order}, ${data.icon}, ${data.coinIcon},
        ${data.subtitle}, ${data.elevatorPitch}, ${data.shortDescription},
        ${data.longDescription}, ${metadata}::jsonb, ${data.notes}
      )
    `;
    return data.id as ArtistTypeId;
  });

it.layer(TestLayer, { timeout: 30_000 })('ArtistTypesRepo', (it) => {
  it.scoped(
    'findAll - returns empty array when no artist types exist',
    Effect.fn(function* () {
      const repo = yield* ArtistTypesRepo;
      const types = yield* repo.findAll();
      expect(types.length).toBe(0);
    }, withTransactionRollback),
  );

  it.scoped(
    'findAll - returns all artist types ordered by order field',
    Effect.fn(function* () {
      const repo = yield* ArtistTypesRepo;

      yield* insertArtistType(createArtistTypeData({ id: 'type-3', name: 'Third', order: 3 }));
      yield* insertArtistType(createArtistTypeData({ id: 'type-1', name: 'First', order: 1 }));
      yield* insertArtistType(createArtistTypeData({ id: 'type-2', name: 'Second', order: 2 }));

      const types = yield* repo.findAll();
      expect(types.length).toBe(3);
      expect(types[0].name).toBe('First');
      expect(types[1].name).toBe('Second');
      expect(types[2].name).toBe('Third');
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - returns artist type when exists',
    Effect.fn(function* () {
      const repo = yield* ArtistTypesRepo;

      const data = createArtistTypeData({
        id: 'find-me-type',
        name: 'Find Me Artist',
      });
      yield* insertArtistType(data);

      const artistType = yield* repo.findById('find-me-type' as ArtistTypeId);
      expect(artistType.id).toBe('find-me-type');
      expect(artistType.name).toBe('Find Me Artist');
      expect(artistType.shortName).toBe('Test');
      expect(artistType.abbreviation).toBe('TA');
      expect(artistType.metadata.strengths).toEqual(['creativity', 'innovation']);
      expect(artistType.metadata.challenges).toEqual(['focus', 'consistency']);
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - fails with ArtistTypeNotFoundError when type does not exist',
    Effect.fn(function* () {
      const repo = yield* ArtistTypesRepo;

      const result = yield* repo.findById('non-existent-type' as ArtistTypeId).pipe(Effect.either);

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(ArtistTypeNotFoundError);
      }
    }, withTransactionRollback),
  );

  it.scoped(
    'insert - creates a new artist type and returns it',
    Effect.fn(function* () {
      const repo = yield* ArtistTypesRepo;

      const artistType = yield* repo.insert({
        id: 'new-artist-type',
        name: 'New Artist',
        shortName: 'New',
        abbreviation: 'NA',
        order: 5,
        icon: 'new-icon',
        coinIcon: 'coin-icon',
        subtitle: 'A new artist type',
        elevatorPitch: 'This is a new artist type.',
        shortDescription: 'Short description.',
        longDescription: 'Long description of the new artist type.',
        metadata: {
          strengths: ['adaptability', 'passion'],
          challenges: ['time management'],
          idealCollaborators: ['other-type'],
        },
        notes: 'Some notes about this type',
      });

      expect(artistType.id).toBe('new-artist-type');
      expect(artistType.name).toBe('New Artist');
      expect(artistType.order).toBe(5);
      expect(artistType.coinIcon).toBe('coin-icon');
      expect(artistType.notes).toBe('Some notes about this type');
      expect(artistType.metadata.strengths).toEqual(['adaptability', 'passion']);
      expect(artistType.metadata.idealCollaborators).toEqual(['other-type']);
    }, withTransactionRollback),
  );

  it.scoped(
    'insert - handles null optional fields correctly',
    Effect.fn(function* () {
      const repo = yield* ArtistTypesRepo;

      const artistType = yield* repo.insert({
        id: 'minimal-artist',
        name: 'Minimal Artist',
        shortName: 'Min',
        abbreviation: 'MI',
        order: 10,
        icon: 'min-icon',
        coinIcon: null,
        subtitle: 'Minimal subtitle',
        elevatorPitch: 'Minimal pitch.',
        shortDescription: 'Minimal short.',
        longDescription: 'Minimal long description.',
        metadata: {
          strengths: ['simplicity'],
          challenges: ['complexity'],
        },
        notes: null,
      });

      expect(artistType.id).toBe('minimal-artist');
      expect(artistType.coinIcon).toBeNull();
      expect(artistType.notes).toBeNull();
    }, withTransactionRollback),
  );

  it.scoped(
    'insert - stores and retrieves metadata with all optional fields',
    Effect.fn(function* () {
      const repo = yield* ArtistTypesRepo;

      const fullMetadata = {
        strengths: ['strength1', 'strength2'],
        challenges: ['challenge1'],
        idealCollaborators: ['collaborator1', 'collaborator2'],
        recommendedPractices: ['practice1'],
        careerPaths: ['path1', 'path2', 'path3'],
        colorPalette: ['#FF0000', '#00FF00', '#0000FF'],
        relatedTypes: ['type-a', 'type-b'],
      };

      const artistType = yield* repo.insert({
        id: 'full-metadata-artist',
        name: 'Full Metadata Artist',
        shortName: 'Full',
        abbreviation: 'FM',
        order: 1,
        icon: 'full-icon',
        subtitle: 'Full metadata subtitle',
        elevatorPitch: 'Full metadata pitch.',
        shortDescription: 'Full metadata short.',
        longDescription: 'Full metadata long.',
        metadata: fullMetadata,
      });

      expect(artistType.metadata.strengths).toEqual(['strength1', 'strength2']);
      expect(artistType.metadata.challenges).toEqual(['challenge1']);
      expect(artistType.metadata.idealCollaborators).toEqual(['collaborator1', 'collaborator2']);
      expect(artistType.metadata.recommendedPractices).toEqual(['practice1']);
      expect(artistType.metadata.careerPaths).toEqual(['path1', 'path2', 'path3']);
      expect(artistType.metadata.colorPalette).toEqual(['#FF0000', '#00FF00', '#0000FF']);
      expect(artistType.metadata.relatedTypes).toEqual(['type-a', 'type-b']);
    }, withTransactionRollback),
  );
});
