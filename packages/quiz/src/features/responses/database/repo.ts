import * as SqlClient from '@effect/sql/SqlClient';
import * as SqlSchema from '@effect/sql/SqlSchema';
import { PgLive } from '@core/database';
import * as Effect from 'effect/Effect';
import { flow } from 'effect/Function';
import * as Schema from 'effect/Schema';
import { QuizResponse, ResponseId, ResponseNotFoundError } from '../domain/schema.js';
import { QuizId } from '../../quiz/domain/schema.js';

//1) Define the Inputs that the repository is expecting, we map these to UpsertPayload because it decouples them like a DTO and lets us
//   easily see what our Repo is expecting to deal with
const CreateResponseInput = QuizResponse.pipe(
  Schema.pick('quizId', 'answers', 'sessionMetadata', 'interactionLogs', 'metadata'),
);

const UpdateResponseInput = QuizResponse.pipe(
  Schema.pick('id', 'quizId', 'answers', 'sessionMetadata', 'interactionLogs', 'metadata'),
);
type UpdateResponseInput = typeof UpdateResponseInput.Type;

// 2) Define the repository as an Effect Service
//    - Uses dependency injection for the database connection (PgLive)
//    - Each method is defined separately to keep error handling isolated from business logic
//    - SqlSchema provides type-safe SQL operations with automatic serialization/deserialization
export class ResponsesRepo extends Effect.Service<ResponsesRepo>()('ResponsesRepo', {
  dependencies: [PgLive],
  effect: Effect.gen(function* () {
    // Get the SQL client from the Effect context
    const sql = yield* SqlClient.SqlClient;

    const findAll = SqlSchema.findAll({
      Result: QuizResponse,
      Request: Schema.Void,
      execute: () => sql`
        SELECT
          *
        FROM
          responses
        WHERE
          deleted_at IS NULL
      `,
    });

    const findByQuizId = SqlSchema.findAll({
      Result: QuizResponse,
      Request: Schema.Struct({ quizId: QuizId }),
      execute: ({ quizId }) => sql`
        SELECT
          *
        FROM
          responses
        WHERE
          quiz_id = ${quizId}
          AND deleted_at IS NULL
      `,
    });

    const findById = SqlSchema.single({
      Result: QuizResponse,
      Request: Schema.Struct({ id: ResponseId }),
      execute: ({ id }) => sql`
        SELECT
          *
        FROM
          responses
        WHERE
          id = ${id}
          AND deleted_at IS NULL
      `,
    });

    const create = SqlSchema.single({
      Result: QuizResponse,
      Request: CreateResponseInput,
      execute: (request) => sql`
        INSERT INTO
          responses ${sql.insert(request)}
        RETURNING
          *
      `,
    });

    const insert = SqlSchema.single({
      Result: QuizResponse,
      Request: Schema.Struct({
        id: Schema.optional(ResponseId),
        quizId: QuizId,
        answers: Schema.optional(Schema.parseJson(Schema.Array(Schema.Any))),
        sessionMetadata: Schema.parseJson(Schema.Any),
        interactionLogs: Schema.optional(Schema.parseJson(Schema.Array(Schema.Any))),
        metadata: Schema.optional(Schema.NullOr(Schema.parseJson(Schema.Any))),
        createdAt: Schema.optional(Schema.String),
      }),
      execute: (request) => {
        const { createdAt, ...insertData } = request;
        if (createdAt !== undefined) {
          return sql`
            INSERT INTO
              responses (
                id,
                quiz_id,
                answers,
                session_metadata,
                interaction_logs,
                metadata,
                created_at,
                updated_at
              )
            VALUES
              (
                ${insertData.id ?? null},
                ${insertData.quizId},
                ${insertData.answers ?? null},
                ${insertData.sessionMetadata},
                ${insertData.interactionLogs ?? null},
                ${insertData.metadata ?? null},
                ${createdAt},
                ${createdAt}
              )
            RETURNING
              *
          `;
        }
        return sql`
          INSERT INTO
            responses ${sql.insert(insertData)}
          RETURNING
            *
        `;
      },
    });

    const update = SqlSchema.single({
      Result: QuizResponse,
      Request: UpdateResponseInput,
      execute: (request) => {
        const { id, ...updateData } = request;
        return sql`
          UPDATE responses
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
      Result: Schema.Struct({ id: ResponseId }),
      Request: Schema.Struct({ id: ResponseId }),
      execute: ({ id }) => sql`
        UPDATE responses
        SET
          deleted_at = now()
        WHERE
          id = ${id}
          AND deleted_at IS NULL
        RETURNING
          id
      `,
    });

    //Permanently removes a response from the database
    const hardDelete = SqlSchema.single({
      Result: Schema.Struct({ id: ResponseId }),
      Request: Schema.Struct({ id: ResponseId }),
      execute: ({ id }) => sql`
        DELETE FROM responses
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

      // findByQuizId: Get all responses for a specific quiz
      findByQuizId: (quizId: QuizId) =>
        findByQuizId({ quizId }).pipe(
          Effect.catchTags({
            ParseError: Effect.die,
            SqlError: Effect.die,
          }),
        ),

      // findById: Get a specific response by ID
      findById: (id: ResponseId) =>
        findById({ id }).pipe(
          Effect.catchTags({
            NoSuchElementException: () => new ResponseNotFoundError({ id }),
            ParseError: Effect.die,
            SqlError: Effect.die,
          }),
        ),

      // del: Soft delete - sets deleted_at timestamp to exclude from queries
      del: (id: ResponseId) =>
        del({ id }).pipe(
          Effect.asVoid, // We don't need the return value, just success/failure
          Effect.catchTags({
            NoSuchElementException: () => new ResponseNotFoundError({ id }), // Record not found or already deleted
            ParseError: Effect.die, // Schema parsing failed - programmer error
            SqlError: Effect.die, // Database connection/query failed - infrastructure error
          }),
        ),

      // hardDelete: Permanently remove a response from the database (use with caution)
      hardDelete: (id: ResponseId) =>
        hardDelete({ id }).pipe(
          Effect.asVoid,
          Effect.catchTags({
            NoSuchElementException: () => new ResponseNotFoundError({ id }), // Record not found
            ParseError: Effect.die, // Schema parsing failed - programmer error
            SqlError: Effect.die, // Database connection/query failed - infrastructure error
          }),
        ),

      update: (request: UpdateResponseInput) =>
        update(request).pipe(
          Effect.catchTags({
            NoSuchElementException: () => new ResponseNotFoundError({ id: request.id }),
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
