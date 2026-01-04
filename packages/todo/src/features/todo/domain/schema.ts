import { UserId } from '@auth';
import * as HttpApiSchema from '@effect/platform/HttpApiSchema';
import * as S from 'effect/Schema';

export const TodoId = S.String.pipe(S.brand('TodoId'));
export type TodoId = typeof TodoId.Type;

// Re-export UserId from auth package for convenience
export { UserId };

export const Todo = S.Struct({
  id: TodoId,
  userId: UserId,
  title: S.String,
  completed: S.Boolean,
  createdAt: S.DateTimeUtc,
});
export type Todo = typeof Todo.Type;

export const CreateTodoInput = S.Struct({
  title: S.String.pipe(S.minLength(1)),
});
export type CreateTodoInput = typeof CreateTodoInput.Type;

export const UpdateTodoInput = S.Struct({
  title: S.optionalWith(S.String.pipe(S.minLength(1)), {
    as: 'Option',
  }),
  completed: S.optionalWith(S.Boolean, { as: 'Option' }),
});
export type UpdateTodoInput = typeof UpdateTodoInput.Type;

export class TodoNotFound extends S.TaggedError<TodoNotFound>()(
  'TodoNotFound',
  {
    id: TodoId,
  },
  HttpApiSchema.annotations({ status: 404 }),
) {}
