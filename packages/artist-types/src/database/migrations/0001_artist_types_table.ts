import * as SqlClient from '@effect/sql/SqlClient';
import * as Effect from 'effect/Effect';

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  yield* sql`
    CREATE TABLE IF NOT EXISTS public.artist_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      abbreviation TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      icon TEXT NOT NULL,
      coin_icon TEXT,
      subtitle TEXT NOT NULL,
      elevator_pitch TEXT NOT NULL,
      short_description TEXT NOT NULL,
      long_description TEXT NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  yield* sql`CREATE INDEX IF NOT EXISTS idx_artist_types_order ON public.artist_types ("order" ASC)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_artist_types_name ON public.artist_types (name)`;
});
