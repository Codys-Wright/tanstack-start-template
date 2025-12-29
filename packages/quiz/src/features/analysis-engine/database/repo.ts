import { SqlClient, SqlSchema } from '@effect/sql';
import {
  AnalysisEngine,
  AnalysisEngineId,
  AnalysisEngineNotFoundError,
} from '@features/quiz/domain';
import { PgLive } from '@core/database';
import { Effect, flow, Schema } from 'effect';

//1) Define the Inputs that the repository is expecting, we map these to UpsertPayload because it decouples them like a DTO and lets us
//   easily see what our Repo is expecting to deal with
const CreateAnalysisEngineInput = AnalysisEngine.pipe(
  Schema.pick(
    'version',
    'name',
    'description',
    'scoringConfig',
    'endings',
    'metadata',
    'isActive',
    'isPublished',
    'isTemp',
    'quizId',
  ),
);

const UpdateAnalysisEngineInput = AnalysisEngine.pipe(
  Schema.pick(
    'id',
    'version',
    'name',
    'description',
    'scoringConfig',
    'endings',
    'metadata',
    'isActive',
    'isPublished',
    'isTemp',
    'quizId',
  ),
);
type UpdateAnalysisEngineInput = typeof UpdateAnalysisEngineInput.Type;

// 2) Define the repository as an Effect Service
//    - Uses dependency injection for the database connection (PgLive)
//    - Each method is defined separately to keep error handling isolated from business logic
//    - SqlSchema provides type-safe SQL operations with automatic serialization/deserialization
export class AnalysisEngineRepo extends Effect.Service<AnalysisEngineRepo>()('AnalysisEngineRepo', {
  dependencies: [PgLive],
  effect: Effect.gen(function* () {
    // Get the SQL client from the Effect context
    const sql = yield* SqlClient.SqlClient;

    const findAll = SqlSchema.findAll({
      Result: AnalysisEngine,
      Request: Schema.Void,
      execute: () => sql`
        SELECT
          *
        FROM
          analysis_engines
        WHERE
          deleted_at IS NULL
        ORDER BY
          created_at DESC
      `,
    });

    const findById = SqlSchema.single({
      Result: AnalysisEngine,
      Request: Schema.Struct({ id: AnalysisEngineId }),
      execute: ({ id }) => sql`
        SELECT
          *
        FROM
          analysis_engines
        WHERE
          id = ${id}
          AND deleted_at IS NULL
      `,
    });

    const findPublished = SqlSchema.findAll({
      Result: AnalysisEngine,
      Request: Schema.Void,
      execute: () => sql`
        SELECT
          *
        FROM
          analysis_engines
        WHERE
          is_published = TRUE
          AND deleted_at IS NULL
        ORDER BY
          created_at DESC
      `,
    });

    const create = SqlSchema.single({
      Result: AnalysisEngine,
      Request: CreateAnalysisEngineInput,
      execute: (request) => {
        // If publishing this engine, unpublish any existing published engines with the same quizId
        if (request.isPublished === true) {
          return sql`
            WITH
              unpublish_others AS (
                UPDATE analysis_engines
                SET
                  is_published = FALSE
                WHERE
                  quiz_id = ${request.quizId}
                  AND is_published = TRUE
                  AND deleted_at IS NULL
              )
            INSERT INTO
              analysis_engines ${sql.insert(request)}
            RETURNING
              *
          `;
        }
        return sql`
          INSERT INTO
            analysis_engines ${sql.insert(request)}
          RETURNING
            *
        `;
      },
    });

    const update = SqlSchema.single({
      Result: AnalysisEngine,
      Request: UpdateAnalysisEngineInput,
      execute: (request) => {
        const { id, ...updateData } = request;
        // If publishing this engine, unpublish any existing published engines with the same quizId
        if (request.isPublished === true) {
          return sql`
            WITH
              current_engine AS (
                SELECT
                  quiz_id
                FROM
                  analysis_engines
                WHERE
                  id = ${id}
                  AND deleted_at IS NULL
              ),
              unpublish_others AS (
                UPDATE analysis_engines
                SET
                  is_published = FALSE
                WHERE
                  quiz_id = (
                    SELECT
                      quiz_id
                    FROM
                      current_engine
                  )
                  AND id != ${id}
                  AND is_published = TRUE
                  AND deleted_at IS NULL
              )
            UPDATE analysis_engines
            SET
              ${sql.update(updateData)}
            WHERE
              id = ${id}
              AND deleted_at IS NULL
            RETURNING
              *
          `;
        }
        return sql`
          UPDATE analysis_engines
          SET
            ${sql.update(updateData)}
          WHERE
            id = ${id}
            AND deleted_at IS NULL
          RETURNING
            *
        `;
      },
    });

    //Only sets the deleted_at timestamp so that it will be excluded from all further queries
    const del = SqlSchema.single({
      Result: Schema.Struct({ id: AnalysisEngineId }),
      Request: Schema.Struct({ id: AnalysisEngineId }),
      execute: ({ id }) => sql`
        UPDATE analysis_engines
        SET
          deleted_at = now()
        WHERE
          id = ${id}
          AND deleted_at IS NULL
        RETURNING
          id
      `,
    });

    //Permanently removes an analysis engine from the database
    const hardDelete = SqlSchema.single({
      Result: Schema.Struct({ id: AnalysisEngineId }),
      Request: Schema.Struct({ id: AnalysisEngineId }),
      execute: ({ id }) => sql`
        DELETE FROM analysis_engines
        WHERE
          id = ${id}
        RETURNING
          id
      `,
    });

    // 4) Return the public API methods with appropriate error handling
    //    Each method transforms database errors into domain-appropriate responses
    return {
      // findAll: If it fails, crash the program (orDie) - this should always work
      findAll: flow(findAll, Effect.orDie),

      // findById: Get a specific analysis engine by ID
      findById: (id: AnalysisEngineId) =>
        findById({ id }).pipe(
          Effect.catchTags({
            NoSuchElementException: () => new AnalysisEngineNotFoundError({ id }),
            ParseError: Effect.die,
            SqlError: Effect.die,
          }),
        ),

      // del: Soft delete - sets deleted_at timestamp to exclude from queries
      del: (id: AnalysisEngineId) =>
        del({ id }).pipe(
          Effect.asVoid, // We don't need the return value, just success/failure
          Effect.catchTags({
            NoSuchElementException: () => new AnalysisEngineNotFoundError({ id }), // Record not found or already deleted
            ParseError: Effect.die, // Schema parsing failed - programmer error
            SqlError: Effect.die, // Database connection/query failed - infrastructure error
          }),
        ),

      // hardDelete: Permanently remove an analysis engine from the database (use with caution)
      hardDelete: (id: AnalysisEngineId) =>
        hardDelete({ id }).pipe(
          Effect.asVoid,
          Effect.catchTags({
            NoSuchElementException: () => new AnalysisEngineNotFoundError({ id }), // Record not found
            ParseError: Effect.die, // Schema parsing failed - programmer error
            SqlError: Effect.die, // Database connection/query failed - infrastructure error
          }),
        ),

      update: (request: UpdateAnalysisEngineInput) =>
        update(request).pipe(
          Effect.catchTags({
            NoSuchElementException: () => new AnalysisEngineNotFoundError({ id: request.id }),
            ParseError: Effect.die,
            SqlError: Effect.die,
          }),
        ),

      // create: If it fails, crash the program - creation should always work with valid input
      create: flow(create, Effect.orDie),

      // findPublished: Get all published analysis engines
      findPublished: flow(findPublished, Effect.orDie),
    } as const;
  }),
}) {}
