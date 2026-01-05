import * as SqlClient from '@effect/sql/SqlClient';
import * as Effect from 'effect/Effect';

/**
 * Migration: Add user_id column to responses table
 *
 * This allows responses to be linked to users (including anonymous users).
 * When an anonymous user claims their account, the onLinkAccount callback
 * will update the user_id to point to the new non-anonymous user.
 *
 * NOTE: We intentionally do NOT add a foreign key constraint to the "user" table.
 * The user table is managed by Better Auth and we want to keep it pure.
 * The relationship is logical, not enforced at the database level.
 */
export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // Add user_id column (nullable for backwards compatibility with existing responses)
  // No FK constraint - the user table is managed by Better Auth
  yield* sql`
    ALTER TABLE public.responses
    ADD COLUMN IF NOT EXISTS user_id TEXT
  `;

  // Create index for efficient user lookups
  yield* sql`CREATE INDEX IF NOT EXISTS idx_responses_user_id ON public.responses (user_id)`;
});
