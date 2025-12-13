import * as SqlClient from "@effect/sql/SqlClient";
import * as Effect from "effect/Effect";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  yield* sql`
    CREATE TABLE IF NOT EXISTS todos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  yield* sql`CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos (user_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos (created_at DESC)`;
});
