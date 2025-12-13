import * as SqlClient from "@effect/sql/SqlClient";
import * as Effect from "effect/Effect";

const STATIC_USER_ID = "00000000-0000-0000-0000-000000000001";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // Insert the static user if it doesn't exist
  yield* sql`
    INSERT INTO users (id, email)
    VALUES (${STATIC_USER_ID}::uuid, 'static@example.com')
    ON CONFLICT (id) DO NOTHING
  `;
});
