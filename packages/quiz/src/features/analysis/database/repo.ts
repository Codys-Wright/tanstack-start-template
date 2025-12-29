import { SqlClient, SqlSchema } from '@effect/sql';
import {
  AnalysisResult,
  AnalysisResultNotFoundError,
  AnalysisResultNotFoundForResponseError,
} from '../analysis/schema.js';
import { ResponseId } from '../responses/schema.js';
import { AnalysisEngineId, AnalysisResultId } from './analysis-engine/schema.js';
import { PgLive } from '@core/database';
import { Effect, flow, Schema } from 'effect';

//1) Define the Inputs that the repository is expecting, we map these to UpsertPayload because it decouples them like a DTO and lets us
//   easily see what our Repo is expecting to deal with
const CreateAnalysisResultInput = AnalysisResult.pipe(
  Schema.pick('engineId', 'engineVersion', 'responseId', 'endingResults', 'metadata', 'analyzedAt'),
);

const UpdateAnalysisResultInput = AnalysisResult.pipe(
  Schema.pick(
    'id',
    'engineId',
    'engineVersion',
    'responseId',
    'endingResults',
    'metadata',
    'analyzedAt',
  ),
);
type UpdateAnalysisResultInput = typeof UpdateAnalysisResultInput.Type;

// 2) Define the repository as an Effect Service
//    - Uses dependency injection for the database connection (PgLive)
//    - Each method is defined separately to keep error handling isolated from business logic
//    - SqlSchema provides type-safe SQL operations with automatic serialization/deserialization
export class AnalysisRepo extends Effect.Service<AnalysisRepo>()('AnalysisRepo', {
  dependencies: [PgLive],
  effect: Effect.gen(function* () {
    // Get the SQL client from the Effect context
    const sql = yield* SqlClient.SqlClient;

    const findAll = SqlSchema.findAll({
      Result: AnalysisResult,
      Request: Schema.Void,
      execute: () => sql`
        SELECT
          *
        FROM
          analysis_results
        WHERE
          deleted_at IS NULL
        ORDER BY
          analyzed_at DESC
      `,
    });

    const findById = SqlSchema.single({
      Result: AnalysisResult,
      Request: Schema.Struct({ id: AnalysisResultId }),
      execute: ({ id }) => sql`
        SELECT
          *
        FROM
          analysis_results
        WHERE
          id = ${id}
          AND deleted_at IS NULL
      `,
    });

    const findByResponseId = SqlSchema.findAll({
      Result: AnalysisResult,
      Request: Schema.Struct({ responseId: ResponseId }),
      execute: ({ responseId }) => sql`
        SELECT
          *
        FROM
          analysis_results
        WHERE
          response_id = ${responseId}
          AND deleted_at IS NULL
        ORDER BY
          analyzed_at DESC
      `,
    });

    const findByEngineId = SqlSchema.findAll({
      Result: AnalysisResult,
      Request: Schema.Struct({ engineId: AnalysisEngineId }),
      execute: ({ engineId }) => sql`
        SELECT
          *
        FROM
          analysis_results
        WHERE
          engine_id = ${engineId}
          AND deleted_at IS NULL
        ORDER BY
          analyzed_at DESC
      `,
    });

    const findByResponseAndEngine = SqlSchema.single({
      Result: AnalysisResult,
      Request: Schema.Struct({
        engineId: AnalysisEngineId,
        responseId: ResponseId,
      }),
      execute: ({ engineId, responseId }) => sql`
        SELECT
          *
        FROM
          analysis_results
        WHERE
          response_id = ${responseId}
          AND engine_id = ${engineId}
          AND deleted_at IS NULL
      `,
    });

    const create = SqlSchema.single({
      Result: AnalysisResult,
      Request: CreateAnalysisResultInput,
      execute: (request) => sql`
        INSERT INTO
          analysis_results ${sql.insert(request)}
        RETURNING
          *
      `,
    });

    const insert = SqlSchema.single({
      Result: AnalysisResult,
      Request: Schema.Struct({
        id: Schema.optional(AnalysisResultId),
        engineId: AnalysisEngineId,
        engineSlug: Schema.String,
        engineVersion: Schema.String,
        responseId: ResponseId,
        endingResults: Schema.parseJson(Schema.Array(Schema.Any)),
        metadata: Schema.optional(Schema.NullOr(Schema.parseJson(Schema.Any))),
        analyzedAt: Schema.String,
        createdAt: Schema.optional(Schema.String),
      }),
      execute: (request) => {
        const { createdAt, ...insertData } = request;
        if (createdAt !== undefined) {
          return sql`
            INSERT INTO
              analysis_results (
                id,
                engine_id,
                engine_slug,
                engine_version,
                response_id,
                ending_results,
                metadata,
                analyzed_at,
                created_at,
                updated_at
              )
            VALUES
              (
                ${insertData.id ?? null},
                ${insertData.engineId},
                ${insertData.engineSlug},
                ${insertData.engineVersion},
                ${insertData.responseId},
                ${insertData.endingResults},
                ${insertData.metadata ?? null},
                ${insertData.analyzedAt},
                ${createdAt},
                ${createdAt}
              )
            RETURNING
              *
          `;
        }
        return sql`
          INSERT INTO
            analysis_results ${sql.insert(insertData)}
          RETURNING
            *
        `;
      },
    });

    const update = SqlSchema.single({
      Result: AnalysisResult,
      Request: UpdateAnalysisResultInput,
      execute: (request) => {
        const { id, ...updateData } = request;
        return sql`
          UPDATE analysis_results
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
      Result: Schema.Struct({ id: AnalysisResultId }),
      Request: Schema.Struct({ id: AnalysisResultId }),
      execute: ({ id }) => sql`
        UPDATE analysis_results
        SET
          deleted_at = now()
        WHERE
          id = ${id}
          AND deleted_at IS NULL
        RETURNING
          id
      `,
    });

    //Permanently removes an analysis result from the database
    const hardDelete = SqlSchema.single({
      Result: Schema.Struct({ id: AnalysisResultId }),
      Request: Schema.Struct({ id: AnalysisResultId }),
      execute: ({ id }) => sql`
        DELETE FROM analysis_results
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

      // findById: Get a specific analysis result by ID
      findById: (id: AnalysisResultId) =>
        findById({ id }).pipe(
          Effect.catchTags({
            NoSuchElementException: () => new AnalysisResultNotFoundError({ id }),
            ParseError: Effect.die,
            SqlError: Effect.die,
          }),
        ),

      // findByResponseId: Get all analysis results for a specific response
      findByResponseId: (responseId: ResponseId) =>
        findByResponseId({ responseId }).pipe(
          Effect.catchTags({
            ParseError: Effect.die,
            SqlError: Effect.die,
          }),
        ),

      // findByEngineId: Get all analysis results for a specific engine
      findByEngineId: (engineId: AnalysisEngineId) =>
        findByEngineId({ engineId }).pipe(
          Effect.catchTags({
            ParseError: Effect.die,
            SqlError: Effect.die,
          }),
        ),

      // findByResponseAndEngine: Get analysis result for a specific response and engine combination
      findByResponseAndEngine: (responseId: ResponseId, engineId: AnalysisEngineId) =>
        findByResponseAndEngine({ responseId, engineId }).pipe(
          Effect.catchTags({
            NoSuchElementException: () =>
              new AnalysisResultNotFoundForResponseError({
                responseId,
                engineId,
              }),
            ParseError: Effect.die,
            SqlError: Effect.die,
          }),
        ),

      // del: Soft delete - sets deleted_at timestamp to exclude from queries
      del: (id: AnalysisResultId) =>
        del({ id }).pipe(
          Effect.asVoid, // We don't need the return value, just success/failure
          Effect.catchTags({
            NoSuchElementException: () => new AnalysisResultNotFoundError({ id }), // Record not found or already deleted
            ParseError: Effect.die, // Schema parsing failed - programmer error
            SqlError: Effect.die, // Database connection/query failed - infrastructure error
          }),
        ),

      // hardDelete: Permanently remove an analysis result from the database (use with caution)
      hardDelete: (id: AnalysisResultId) =>
        hardDelete({ id }).pipe(
          Effect.asVoid,
          Effect.catchTags({
            NoSuchElementException: () => new AnalysisResultNotFoundError({ id }), // Record not found
            ParseError: Effect.die, // Schema parsing failed - programmer error
            SqlError: Effect.die, // Database connection/query failed - infrastructure error
          }),
        ),

      update: (request: UpdateAnalysisResultInput) =>
        update(request).pipe(
          Effect.catchTags({
            NoSuchElementException: () => new AnalysisResultNotFoundError({ id: request.id }),
            ParseError: Effect.die,
            SqlError: Effect.die,
          }),
        ),

      // create: If it fails, crash the program - creation should always work with valid input
      create: flow(create, Effect.orDie),

      // insert: Insert with custom createdAt timestamp (for seeding)
      insert: flow(insert, Effect.orDie),
    } as const;
  }),
}) {}
