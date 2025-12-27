import { DomainApi } from "@/features/core/domain";
import { AuthContext } from "@/features/auth";
import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder";
import * as HttpApiError from "@effect/platform/HttpApiError";
import * as Layer from "effect/Layer";
import * as Effect from "effect/Effect";
import { TodosService } from "./todos-service";

export const TodosApiLive = HttpApiBuilder.group(
  DomainApi,
  "todos",
  (handlers) =>
    handlers
      .handle("list", () =>
        Effect.gen(function* () {
          const currentUser = yield* AuthContext;
          yield* Effect.log(
            `[HTTP API] Listing todos for user: ${currentUser.userId}`,
          );
          const todos = yield* TodosService;
          return yield* todos.list(currentUser.userId);
        }).pipe(
          Effect.mapError((error) => new HttpApiError.InternalServerError({
            message: error.message || "Database error"
          })),
        ),
      )
      .handle("getById", ({ path }) =>
        Effect.gen(function* () {
          const currentUser = yield* AuthContext;
          yield* Effect.log(
            `[HTTP API] Getting todo ${path.id} for user: ${currentUser.userId}`,
          );
          const todos = yield* TodosService;
          return yield* todos.getById(path.id, currentUser.userId);
        }),
      )
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          const currentUser = yield* AuthContext;
          yield* Effect.log(
            `[HTTP API] Creating todo for user: ${currentUser.userId}`,
          );
          const todos = yield* TodosService;
          return yield* todos.create(payload, currentUser.userId);
        }),
      )
      .handle("update", ({ path, payload }) =>
        Effect.gen(function* () {
          const currentUser = yield* AuthContext;
          yield* Effect.log(
            `[HTTP API] Updating todo ${path.id} for user: ${currentUser.userId}`,
          );
          const todos = yield* TodosService;
          return yield* todos.update(path.id, payload, currentUser.userId);
        }),
      )
      .handle("remove", ({ path }) =>
        Effect.gen(function* () {
          const currentUser = yield* AuthContext;
          yield* Effect.log(
            `[HTTP API] Removing todo ${path.id} for user: ${currentUser.userId}`,
          );
          const todos = yield* TodosService;
          return yield* todos.remove(path.id, currentUser.userId);
        }),
      ),
).pipe(Layer.provide(TodosService.Default));
