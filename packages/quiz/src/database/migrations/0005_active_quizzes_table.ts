import * as SqlClient from '@effect/sql/SqlClient';
import * as Effect from 'effect/Effect';

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // Create active_quizzes_updated_at trigger function
  yield* sql`
    CREATE OR REPLACE FUNCTION public.update_active_quizzes_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql'
  `;

  // Create active_quizzes table
  yield* sql`
    CREATE TABLE IF NOT EXISTS public.active_quizzes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug VARCHAR(255) NOT NULL UNIQUE,
      quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
      engine_id UUID NOT NULL REFERENCES public.analysis_engines(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  // Create indexes
  yield* sql`CREATE INDEX IF NOT EXISTS idx_active_quizzes_engine_id ON public.active_quizzes (engine_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_active_quizzes_quiz_id ON public.active_quizzes (quiz_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_active_quizzes_slug ON public.active_quizzes (slug)`;

  // Create trigger for updated_at
  yield* sql`DROP TRIGGER IF EXISTS trigger_update_active_quizzes_updated_at ON public.active_quizzes`;
  yield* sql`
    CREATE TRIGGER trigger_update_active_quizzes_updated_at 
    BEFORE UPDATE ON public.active_quizzes 
    FOR EACH ROW EXECUTE FUNCTION public.update_active_quizzes_updated_at()
  `;
});
