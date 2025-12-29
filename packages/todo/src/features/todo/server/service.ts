import * as Effect from 'effect/Effect';
import { TodoRepository } from '../database/repo';
import type { CreateTodoInput, TodoId, UpdateTodoInput, UserId } from '../domain/index';

export class TodoService extends Effect.Service<TodoService>()('TodoService', {
  dependencies: [TodoRepository.Default],
  effect: Effect.gen(function* () {
    const repo = yield* TodoRepository;

    return {
      list: (userId: UserId) => repo.list(userId),
      getById: (userId: UserId, id: TodoId) => repo.getById({ id, userId }),
      create: (userId: UserId, input: CreateTodoInput) => repo.create({ userId, input }),
      update: (userId: UserId, id: TodoId, input: UpdateTodoInput) =>
        repo.update(userId, id, input),
      remove: (userId: UserId, id: TodoId) => repo.remove({ userId, id }),
    } as const;
  }),
}) {}
