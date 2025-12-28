import { PgLive } from "@core/database";
import * as SqlClient from "@effect/sql/SqlClient";
import * as SqlSchema from "@effect/sql/SqlSchema";
import * as Effect from "effect/Effect";
import { flow } from "effect/Function";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import {
  CreateTodoInput,
  Todo,
  TodoId,
  TodoNotFound,
  UpdateTodoInput,
  UserId,
} from "../domain/todo-schema";

export class TodosRepository extends Effect.Service<TodosRepository>()(
  "@todo/database/TodosRepository",
  {
    dependencies: [PgLive],
    effect: Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      const list = flow(
        SqlSchema.findAll({
          Request: UserId,
          Result: Todo,
          execute: (userId) => sql`
            SELECT
              id,
              user_id AS "userId",
              title,
              completed,
              created_at AS "createdAt"
            FROM
              public.todos
            WHERE
              user_id = ${userId}
            ORDER BY
              created_at DESC
          `,
        }),
        Effect.orDie,
        Effect.withSpan("TodosRepository.list"),
      );

      const getById = flow(
        SqlSchema.findOne({
          Request: Schema.Struct({ id: TodoId, userId: UserId }),
          Result: Todo,
          execute: (req) => sql`
            SELECT
              id,
              user_id AS "userId",
              title,
              completed,
              created_at AS "createdAt"
            FROM
              public.todos
            WHERE
              id = ${req.id}
              AND user_id = ${req.userId}
          `,
        }),
        Effect.flatMap(
          Option.match({
            onNone: () =>
              Effect.fail(
                new TodoNotFound({ id: "" as TodoId })
              ),
            onSome: Effect.succeed,
          })
        ),
        Effect.orDie,
        Effect.withSpan("TodosRepository.getById"),
      );

      const create = flow(
        SqlSchema.single({
          Request: Schema.Struct({
            userId: UserId,
            input: CreateTodoInput,
          }),
          Result: Todo,
          execute: (req) => sql`
            INSERT INTO public.todos (user_id, title, completed)
            VALUES (${req.userId}, ${req.input.title}, false)
            RETURNING
              id,
              user_id AS "userId",
              title,
              completed,
              created_at AS "createdAt"
          `,
        }),
        Effect.orDie,
        Effect.withSpan("TodosRepository.create"),
      );

      const update = (userId: UserId, id: TodoId, input: UpdateTodoInput) =>
        Effect.gen(function* () {
          const titleValue = Option.getOrNull(input.title);
          const completedValue = Option.getOrNull(input.completed);

          if (titleValue === null && completedValue === null) {
            // No updates, just return the existing todo
            return yield* getById({ id, userId });
          }

          // Build dynamic update query based on what's provided
          const result = yield* Effect.gen(function* () {
            if (titleValue !== null && completedValue !== null) {
              return yield* SqlSchema.findOne({
                Request: Schema.Struct({
                  userId: UserId,
                  id: TodoId,
                  title: Schema.String,
                  completed: Schema.Boolean,
                }),
                Result: Todo,
                execute: (req) => sql`
                  UPDATE public.todos
                  SET
                    title = ${req.title},
                    completed = ${req.completed}
                  WHERE id = ${req.id} AND user_id = ${req.userId}
                  RETURNING
                    id,
                    user_id AS "userId",
                    title,
                    completed,
                    created_at AS "createdAt"
                `,
              })({ userId, id, title: titleValue, completed: completedValue });
            } else if (titleValue !== null) {
              return yield* SqlSchema.findOne({
                Request: Schema.Struct({
                  userId: UserId,
                  id: TodoId,
                  title: Schema.String,
                }),
                Result: Todo,
                execute: (req) => sql`
                  UPDATE public.todos
                  SET title = ${req.title}
                  WHERE id = ${req.id} AND user_id = ${req.userId}
                  RETURNING
                    id,
                    user_id AS "userId",
                    title,
                    completed,
                    created_at AS "createdAt"
                `,
              })({ userId, id, title: titleValue });
            } else {
              return yield* SqlSchema.findOne({
                Request: Schema.Struct({
                  userId: UserId,
                  id: TodoId,
                  completed: Schema.Boolean,
                }),
                Result: Todo,
                execute: (req) => sql`
                  UPDATE public.todos
                  SET completed = ${req.completed}
                  WHERE id = ${req.id} AND user_id = ${req.userId}
                  RETURNING
                    id,
                    user_id AS "userId",
                    title,
                    completed,
                    created_at AS "createdAt"
                `,
              })({ userId, id, completed: completedValue! });
            }
          });

          return yield* Option.match(result, {
            onNone: () => Effect.fail(new TodoNotFound({ id })),
            onSome: Effect.succeed,
          });
        }).pipe(Effect.orDie, Effect.withSpan("TodosRepository.update"));

      const remove = flow(
        SqlSchema.void({
          Request: Schema.Struct({ userId: UserId, id: TodoId }),
          execute: (req) => sql`
            DELETE FROM public.todos
            WHERE id = ${req.id} AND user_id = ${req.userId}
          `,
        }),
        Effect.orDie,
        Effect.withSpan("TodosRepository.remove"),
      );

      return {
        list,
        getById,
        create,
        update,
        remove,
      } as const;
    }),
  },
) {}
