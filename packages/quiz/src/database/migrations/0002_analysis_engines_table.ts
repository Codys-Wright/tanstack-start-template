import * as SqlClient from '@effect/sql/SqlClient';
import * as Effect from 'effect/Effect';

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // Create analysis_engines table
  yield* sql`
    CREATE TABLE IF NOT EXISTS public.analysis_engines (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      version JSONB NOT NULL,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      scoring_config JSONB NOT NULL,
      endings JSONB DEFAULT '[]'::jsonb NOT NULL,
      metadata JSONB,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      deleted_at TIMESTAMPTZ,
      is_published BOOLEAN NOT NULL DEFAULT false,
      is_temp BOOLEAN NOT NULL DEFAULT false,
      quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
      CONSTRAINT analysis_engines_version_has_semver CHECK (
        (version ? 'semver') AND 
        ((version ->> 'semver') IS NOT NULL) AND 
        ((version ->> 'semver') <> '')
      )
    )
  `;

  // Create indexes
  yield* sql`CREATE INDEX IF NOT EXISTS idx_analysis_engines_created_at ON public.analysis_engines (created_at)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_analysis_engines_deleted_at ON public.analysis_engines (deleted_at)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_analysis_engines_is_active ON public.analysis_engines (is_active)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_analysis_engines_is_temp ON public.analysis_engines (is_temp) WHERE deleted_at IS NULL`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_analysis_engines_quiz_id ON public.analysis_engines (quiz_id) WHERE deleted_at IS NULL`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_analysis_engines_version ON public.analysis_engines (version)`;

  // Create trigger for updated_at
  yield* sql`DROP TRIGGER IF EXISTS update_analysis_engines_updated_at ON public.analysis_engines`;
  yield* sql`
    CREATE TRIGGER update_analysis_engines_updated_at 
    BEFORE UPDATE ON public.analysis_engines 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()
  `;
});
