import * as SqlClient from '@effect/sql/SqlClient';
import * as Effect from 'effect/Effect';

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  yield* sql`
    CREATE TABLE IF NOT EXISTS public.todos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  yield* sql`CREATE INDEX IF NOT EXISTS idx_todos_created_at ON public.todos (created_at DESC)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_todos_user_id ON public.todos (user_id)`;
});
