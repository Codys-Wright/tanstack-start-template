import * as SqlClient from '@effect/sql/SqlClient';
import * as Effect from 'effect/Effect';

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // Create quizzes table
  yield* sql`
    CREATE TABLE IF NOT EXISTS public.quizzes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      version JSONB NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT,
      description TEXT,
      questions JSONB DEFAULT '[]'::jsonb NOT NULL,
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      deleted_at TIMESTAMPTZ,
      is_published BOOLEAN NOT NULL DEFAULT false,
      is_temp BOOLEAN NOT NULL DEFAULT false,
      CONSTRAINT quizzes_version_has_semver CHECK (
        (version ? 'semver') AND 
        ((version ->> 'semver') IS NOT NULL) AND 
        ((version ->> 'semver') <> '')
      )
    )
  `;

  // Create indexes
  yield* sql`CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON public.quizzes (created_at)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_quizzes_deleted_at ON public.quizzes (deleted_at)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_quizzes_is_published ON public.quizzes (is_published)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_quizzes_is_temp ON public.quizzes (is_temp) WHERE deleted_at IS NULL`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_quizzes_published_created ON public.quizzes (created_at) WHERE is_published = true AND deleted_at IS NULL`;

  // Create updated_at trigger function if it doesn't exist
  yield* sql`
    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ language 'plpgsql'
  `;

  // Create trigger for updated_at
  yield* sql`
    DROP TRIGGER IF EXISTS update_quizzes_updated_at ON public.quizzes
  `;
  yield* sql`
    CREATE TRIGGER update_quizzes_updated_at 
    BEFORE UPDATE ON public.quizzes 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()
  `;
});
