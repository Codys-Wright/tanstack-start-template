import * as SqlClient from '@effect/sql/SqlClient';
import * as Effect from 'effect/Effect';

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // Create analysis_results table
  yield* sql`
    CREATE TABLE IF NOT EXISTS public.analysis_results (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      engine_id UUID NOT NULL REFERENCES public.analysis_engines(id),
      engine_version JSONB NOT NULL,
      response_id UUID NOT NULL REFERENCES public.responses(id),
      ending_results JSONB DEFAULT '[]'::jsonb NOT NULL,
      metadata JSONB,
      analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      deleted_at TIMESTAMPTZ,
      CONSTRAINT analysis_results_engine_version_has_semver CHECK (
        (engine_version ? 'semver') AND 
        ((engine_version ->> 'semver') IS NOT NULL) AND 
        ((engine_version ->> 'semver') <> '')
      )
    )
  `;

  // Create indexes
  yield* sql`CREATE INDEX IF NOT EXISTS idx_analysis_results_analyzed_at ON public.analysis_results (analyzed_at)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_analysis_results_created_at ON public.analysis_results (created_at)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_analysis_results_deleted_at ON public.analysis_results (deleted_at)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_analysis_results_engine_analyzed ON public.analysis_results (engine_id, analyzed_at) WHERE deleted_at IS NULL`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_analysis_results_engine_id ON public.analysis_results (engine_id)`;
  yield* sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_analysis_results_response_engine ON public.analysis_results (response_id, engine_id) WHERE deleted_at IS NULL`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_analysis_results_response_id ON public.analysis_results (response_id)`;

  // Create trigger for updated_at
  yield* sql`DROP TRIGGER IF EXISTS update_analysis_results_updated_at ON public.analysis_results`;
  yield* sql`
    CREATE TRIGGER update_analysis_results_updated_at 
    BEFORE UPDATE ON public.analysis_results 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()
  `;
});
