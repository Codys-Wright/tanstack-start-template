import { makeCleanup, makeSeeder, type CleanupEntry, type SeederEntry } from '@core/database';
import * as SqlClient from '@effect/sql/SqlClient';
import * as Effect from 'effect/Effect';
import { getAllArtistTypeSeedData } from './data/index.js';

export const artistTypes = makeSeeder(
  { name: 'artist_types', defaultCount: 10, dependsOn: [] },
  () =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const seedData = yield* Effect.promise(() => getAllArtistTypeSeedData());

      const existing = yield* sql<{ count: string }>`
        SELECT COUNT(*)::text as count FROM artist_types
      `;
      const existingCount = Number(existing[0].count);

      if (existingCount >= seedData.length) {
        return { name: 'artist_types', existing: existingCount, created: 0 };
      }

      let created = 0;
      const now = new Date().toISOString();

      for (const seed of seedData) {
        yield* sql`
          INSERT INTO artist_types (
            id, name, short_name, abbreviation, "order", icon, coin_icon,
            subtitle, elevator_pitch, short_description, long_description,
            metadata, notes, created_at, updated_at
          ) VALUES (
            ${seed.id}, ${seed.name}, ${seed.shortName}, ${seed.abbreviation},
            ${seed.order}, ${seed.icon}, ${seed.coinIcon},
            ${seed.subtitle}, ${seed.elevatorPitch}, ${seed.shortDescription},
            ${seed.longDescription}, ${JSON.stringify(seed.metadata)},
            ${seed.notes}, ${now}, ${now}
          )
          ON CONFLICT (id) DO NOTHING
        `;
        created++;
      }

      return { name: 'artist_types', existing: existingCount, created };
    }),
);

export const artistTypeCleanup = makeCleanup({
  name: 'artist_types',
  countSql: (sql) =>
    sql<{
      count: number;
    }>`SELECT COUNT(*)::int as count FROM artist_types`.pipe(Effect.map((r) => r[0].count)),
  deleteSql: (sql) => sql`DELETE FROM artist_types`.pipe(Effect.asVoid),
});

export const artistTypeCleanupEntries = (): ReadonlyArray<CleanupEntry> => [artistTypeCleanup()];

export const artistTypeSeederEntries = (): ReadonlyArray<SeederEntry> => [artistTypes()];
