import * as SqlClient from '@effect/sql/SqlClient';
import * as Effect from 'effect/Effect';

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // Create responses table
  yield* sql`
    CREATE TABLE IF NOT EXISTS public.responses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      quiz_id UUID NOT NULL REFERENCES public.quizzes(id),
      answers JSONB DEFAULT '[]'::jsonb NOT NULL,
      session_metadata JSONB NOT NULL,
      interaction_logs JSONB DEFAULT '[]'::jsonb,
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      deleted_at TIMESTAMPTZ
    )
  `;

  // Create indexes
  yield* sql`CREATE INDEX IF NOT EXISTS idx_responses_created_at ON public.responses (created_at)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_responses_deleted_at ON public.responses (deleted_at)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_responses_quiz_id ON public.responses (quiz_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_responses_session_metadata_started_at ON public.responses USING gin ((session_metadata -> 'startedAt'))`;

  // Create trigger for updated_at
  yield* sql`DROP TRIGGER IF EXISTS update_responses_updated_at ON public.responses`;
  yield* sql`
    CREATE TRIGGER update_responses_updated_at 
    BEFORE UPDATE ON public.responses 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()
  `;
});
