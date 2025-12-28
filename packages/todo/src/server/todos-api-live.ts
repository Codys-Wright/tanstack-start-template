import { AuthContext } from "@auth/server";
import * as HttpApi from "@effect/platform/HttpApi";
import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder";
import * as HttpApiGroup from "@effect/platform/HttpApiGroup";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { TodosApiGroup } from "../domain/index";
import { TodosService } from "./todos-service";

/**
 * Internal API type that includes just the TodosApiGroup.
 * Used to properly type the handlers.
 */
class TodosOnlyApi extends HttpApi.make("todos-api").add(TodosApiGroup) {}

/**
 * Creates the HttpApi handlers for the todos group.
 *
 * This function accepts any HttpApi that includes the "todos" group,
 * allowing it to be used with different API compositions.
 *
 * @example
 * ```ts
 * import { makeTodosApiLive, TodosApiGroup } from "@todo";
 *
 * class DomainApi extends HttpApi.make("api").add(TodosApiGroup) {}
 *
 * const TodosApiLive = makeTodosApiLive(DomainApi);
 * ```
 */
export const makeTodosApiLive = <
  ApiId extends string,
  Groups extends HttpApiGroup.HttpApiGroup.Any,
  ApiError,
  ApiR
>(
  _api: HttpApi.HttpApi<ApiId, Groups, ApiError, ApiR>
): Layer.Layer<HttpApiGroup.ApiGroup<ApiId, "todos">, never, AuthContext> =>
  HttpApiBuilder.group(TodosOnlyApi, "todos", (handlers) =>
    handlers
      .handle("list", () =>
        Effect.gen(function* () {
          yield* Effect.log(`[HTTP API] Listing todos`);
          const auth = yield* AuthContext;
          const todos = yield* TodosService;
          return yield* todos.list(auth.userId);
        }).pipe(Effect.catchAll(Effect.die))
      )
      .handle("getById", ({ path }) =>
        Effect.gen(function* () {
          yield* Effect.log(`[HTTP API] Getting todo ${path.id}`);
          const auth = yield* AuthContext;
          const todos = yield* TodosService;
          return yield* todos.getById(auth.userId, path.id);
        }).pipe(Effect.catchAll(Effect.die))
      )
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          yield* Effect.log(`[HTTP API] Creating todo`);
          const auth = yield* AuthContext;
          const todos = yield* TodosService;
          return yield* todos.create(auth.userId, payload);
        }).pipe(Effect.catchAll(Effect.die))
      )
      .handle("update", ({ path, payload }) =>
        Effect.gen(function* () {
          yield* Effect.log(`[HTTP API] Updating todo ${path.id}`);
          const auth = yield* AuthContext;
          const todos = yield* TodosService;
          return yield* todos.update(auth.userId, path.id, payload);
        }).pipe(Effect.catchAll(Effect.die))
      )
      .handle("remove", ({ path }) =>
        Effect.gen(function* () {
          yield* Effect.log(`[HTTP API] Removing todo ${path.id}`);
          const auth = yield* AuthContext;
          const todos = yield* TodosService;
          return yield* todos.remove(auth.userId, path.id);
        }).pipe(Effect.catchAll(Effect.die))
      )
  ).pipe(Layer.provide(TodosService.Default)) as Layer.Layer<
    HttpApiGroup.ApiGroup<ApiId, "todos">,
    never,
    AuthContext
  >;
