import { AuthContext } from '@auth/server';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { TodoRpc } from '../domain/index';
import { TodoService } from './service';

export const TodoRpcLive = TodoRpc.toLayer(
  Effect.gen(function* () {
    const todos = yield* TodoService;

    return TodoRpc.of({
      todo_list: Effect.fn(function* () {
        const auth = yield* AuthContext;
        yield* Effect.log(`[RPC] Listing todos for user: ${auth.userId}`);
        return yield* todos.list(auth.userId);
      }),

      todo_getById: Effect.fn(function* ({ id }) {
        const auth = yield* AuthContext;
        yield* Effect.log(`[RPC] Getting todo ${id} for user: ${auth.userId}`);
        return yield* todos.getById(auth.userId, id);
      }),

      todo_create: Effect.fn(function* ({ input }) {
        const auth = yield* AuthContext;
        yield* Effect.log(`[RPC] Creating todo "${input.title}" for user: ${auth.userId}`);
        return yield* todos.create(auth.userId, input);
      }),

      todo_update: Effect.fn(function* ({ id, input }) {
        const auth = yield* AuthContext;
        yield* Effect.log(`[RPC] Updating todo ${id} for user: ${auth.userId}`);
        return yield* todos.update(auth.userId, id, input);
      }),

      todo_remove: Effect.fn(function* ({ id }) {
        const auth = yield* AuthContext;
        yield* Effect.log(`[RPC] Removing todo ${id} for user: ${auth.userId}`);
        return yield* todos.remove(auth.userId, id);
      }),
    });
  }),
).pipe(Layer.provide(TodoService.Default));
