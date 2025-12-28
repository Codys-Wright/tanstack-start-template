import * as SqlClient from '@effect/sql/SqlClient';
import * as Effect from 'effect/Effect';

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // Add fake column to mark seeded data
  yield* sql`
    ALTER TABLE public.todos
    ADD COLUMN IF NOT EXISTS fake BOOLEAN NOT NULL DEFAULT false
  `;

  // Index for cleanup queries
  yield* sql`CREATE INDEX IF NOT EXISTS idx_todos_fake ON public.todos (fake) WHERE fake = true`;
});
