import { AuthContext } from '@auth/server';
import * as HttpApiBuilder from '@effect/platform/HttpApiBuilder';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { TodosApi } from '../domain/index.js';
import { TodosService } from './todos-service.js';

/**
 * TodosApiLive - HTTP API handlers for the todos group.
 *
 * Uses TodosApi directly - no complex generics or type casting needed.
 * Compose with HttpLayerRouter.addHttpApi(TodosApi) at the server level.
 *
 * @example
 * ```ts
 * import { TodosApi } from "@todo";
 * import { TodosApiLive } from "@todo/server";
 * import * as HttpLayerRouter from "@effect/platform/HttpLayerRouter";
 *
 * const TodosRoutes = HttpLayerRouter.addHttpApi(TodosApi).pipe(
 *   Layer.provide(TodosApiLive)
 * );
 * ```
 */
export const TodosApiLive = HttpApiBuilder.group(TodosApi, 'todos', (handlers) =>
  handlers
    .handle('list', () =>
      Effect.gen(function* () {
        yield* Effect.log(`[HTTP API] Listing todos`);
        const auth = yield* AuthContext;
        const todos = yield* TodosService;
        return yield* todos.list(auth.userId);
      }),
    )
    .handle('getById', ({ path }) =>
      Effect.gen(function* () {
        yield* Effect.log(`[HTTP API] Getting todo ${path.id}`);
        const auth = yield* AuthContext;
        const todos = yield* TodosService;
        return yield* todos.getById(auth.userId, path.id);
      }),
    )
    .handle('create', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log(`[HTTP API] Creating todo`);
        const auth = yield* AuthContext;
        const todos = yield* TodosService;
        return yield* todos.create(auth.userId, payload);
      }),
    )
    .handle('update', ({ path, payload }) =>
      Effect.gen(function* () {
        yield* Effect.log(`[HTTP API] Updating todo ${path.id}`);
        const auth = yield* AuthContext;
        const todos = yield* TodosService;
        return yield* todos.update(auth.userId, path.id, payload);
      }),
    )
    .handle('remove', ({ path }) =>
      Effect.gen(function* () {
        yield* Effect.log(`[HTTP API] Removing todo ${path.id}`);
        const auth = yield* AuthContext;
        const todos = yield* TodosService;
        return yield* todos.remove(auth.userId, path.id);
      }),
    ),
).pipe(Layer.provide(TodosService.Default));
