import { AuthContext } from '@auth/server';
import * as HttpApiBuilder from '@effect/platform/HttpApiBuilder';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { TodoApi } from '../domain/index.js';
import { TodoService } from './service.js';

/**
 * TodoApiLive - HTTP API handlers for the todos group.
 *
 * Uses TodoApi directly - no complex generics or type casting needed.
 * Compose with HttpLayerRouter.addHttpApi(TodoApi) at the server level.
 *
 * @example
 * ```ts
 * import { TodoApi } from "@todo";
 * import { TodoApiLive } from "@todo/server";
 * import * as HttpLayerRouter from "@effect/platform/HttpLayerRouter";
 *
 * const TodoRoutes = HttpLayerRouter.addHttpApi(TodoApi).pipe(
 *   Layer.provide(TodoApiLive)
 * );
 * ```
 */
export const TodoApiLive = HttpApiBuilder.group(TodoApi, 'todos', (handlers) =>
  handlers
    .handle('list', () =>
      Effect.gen(function* () {
        yield* Effect.log(`[HTTP API] Listing todos`);
        const auth = yield* AuthContext;
        const todos = yield* TodoService;
        return yield* todos.list(auth.userId);
      }),
    )
    .handle('getById', ({ path }) =>
      Effect.gen(function* () {
        yield* Effect.log(`[HTTP API] Getting todo ${path.id}`);
        const auth = yield* AuthContext;
        const todos = yield* TodoService;
        return yield* todos.getById(auth.userId, path.id);
      }),
    )
    .handle('create', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log(`[HTTP API] Creating todo`);
        const auth = yield* AuthContext;
        const todos = yield* TodoService;
        return yield* todos.create(auth.userId, payload);
      }),
    )
    .handle('update', ({ path, payload }) =>
      Effect.gen(function* () {
        yield* Effect.log(`[HTTP API] Updating todo ${path.id}`);
        const auth = yield* AuthContext;
        const todos = yield* TodoService;
        return yield* todos.update(auth.userId, path.id, payload);
      }),
    )
    .handle('remove', ({ path }) =>
      Effect.gen(function* () {
        yield* Effect.log(`[HTTP API] Removing todo ${path.id}`);
        const auth = yield* AuthContext;
        const todos = yield* TodoService;
        return yield* todos.remove(auth.userId, path.id);
      }),
    ),
).pipe(Layer.provide(TodoService.Default));
