import * as HttpApiSchema from "@effect/platform/HttpApiSchema";
import * as Schema from "effect/Schema";
import { UserId } from "@auth";

export const TodoId = Schema.String.pipe(Schema.brand("TodoId"));
export type TodoId = typeof TodoId.Type;

export const Todo = Schema.Struct({
  id: TodoId,
  title: Schema.String,
  completed: Schema.Boolean,
  userId: UserId, // Changed from ownerId to match DB column (user_id)
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc, // Added to match DB
});
export type Todo = typeof Todo.Type;

export const CreateTodoInput = Schema.Struct({
  title: Schema.String.pipe(Schema.minLength(1)),
});
export type CreateTodoInput = typeof CreateTodoInput.Type;

export const UpdateTodoInput = Schema.Struct({
  title: Schema.optionalWith(Schema.String.pipe(Schema.minLength(1)), {
    as: "Option",
  }),
  completed: Schema.optionalWith(Schema.Boolean, { as: "Option" }),
});
export type UpdateTodoInput = typeof UpdateTodoInput.Type;

export class TodoNotFound extends Schema.TaggedError<TodoNotFound>()(
  "TodoNotFound",
  {
    id: TodoId,
  },
  HttpApiSchema.annotations({ status: 404 })
) {}
