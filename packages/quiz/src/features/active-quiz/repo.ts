import { SqlClient, SqlSchema } from "@effect/sql";
import { PgLive } from "@core/database";
import { Effect, flow, Schema } from "effect";
import { ActiveQuiz, ActiveQuizNotFoundError } from "../../domain/active-quiz/active-quiz-rpc.js";

//1) Define the Inputs that the repository is expecting
const CreateActiveQuizInput = ActiveQuiz.pipe(Schema.pick("slug", "quizId", "engineId"));

const UpdateActiveQuizInput = ActiveQuiz.pipe(Schema.pick("id", "slug", "quizId", "engineId"));
type UpdateActiveQuizInput = typeof UpdateActiveQuizInput.Type;

// 2) Define the repository as an Effect Service
export class ActiveQuizRepo extends Effect.Service<ActiveQuizRepo>()("ActiveQuizRepo", {
  dependencies: [PgLive],
  effect: Effect.gen(function* () {
    // Get the SQL client from the Effect context
    const sql = yield* SqlClient.SqlClient;

    const findAll = SqlSchema.findAll({
      Result: ActiveQuiz,
      Request: Schema.Void,
      execute: () => sql`
        SELECT
          *
        FROM
          active_quizzes
        ORDER BY
          created_at DESC
      `,
    });

    const findBySlug = SqlSchema.single({
      Result: ActiveQuiz,
      Request: Schema.Struct({ slug: Schema.String }),
      execute: ({ slug }) => sql`
        SELECT
          *
        FROM
          active_quizzes
        WHERE
          slug = ${slug}
      `,
    });

    const create = SqlSchema.single({
      Result: ActiveQuiz,
      Request: CreateActiveQuizInput,
      execute: (request) => sql`
        INSERT INTO
          active_quizzes ${sql.insert(request)}
        RETURNING
          *
      `,
    });

    const update = SqlSchema.single({
      Result: ActiveQuiz,
      Request: UpdateActiveQuizInput,
      execute: (request) => sql`
        UPDATE active_quizzes
        SET
          ${sql.update(request)}
        WHERE
          id = ${request.id}
        RETURNING
          *
      `,
    });

    const deleteBySlug = SqlSchema.single({
      Request: Schema.Struct({ slug: Schema.String }),
      Result: Schema.Unknown,
      execute: ({ slug }) => sql`
        DELETE FROM active_quizzes
        WHERE
          slug = ${slug}
        RETURNING
          id
      `,
    });

    // 3) Return the public API methods with appropriate error handling
    return {
      // findAll: Get all active quizzes
      findAll: flow(findAll, Effect.orDie),

      // findBySlug: Get active quiz by slug
      findBySlug: (slug: string) =>
        findBySlug({ slug }).pipe(
          Effect.catchTags({
            NoSuchElementException: () => new ActiveQuizNotFoundError({ slug }),
            ParseError: Effect.die,
            SqlError: Effect.die,
          }),
        ),

      // create: Create a new active quiz
      create: flow(create, Effect.orDie),

      // update: Update an existing active quiz
      update: (request: UpdateActiveQuizInput) =>
        update(request).pipe(
          Effect.catchTags({
            NoSuchElementException: () => new ActiveQuizNotFoundError({ slug: request.slug }),
            ParseError: Effect.die,
            SqlError: Effect.die,
          }),
        ),

      // deleteBySlug: Delete an active quiz by slug
      deleteBySlug: (slug: string) =>
        deleteBySlug({ slug }).pipe(
          Effect.asVoid,
          Effect.catchTags({
            NoSuchElementException: () => new ActiveQuizNotFoundError({ slug }),
            ParseError: Effect.die,
            SqlError: Effect.die,
          }),
        ),
    } as const;
  }),
}) {}
