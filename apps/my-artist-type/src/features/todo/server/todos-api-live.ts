import { DomainApi } from "../../core/domain";
import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder";
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
          const mockUserId = "mock-user-id" as any;
          yield* Effect.log(`[HTTP API] Listing todos for user: ${mockUserId}`);
          const todos = yield* TodosService;
          return yield* todos.list(mockUserId);
        }).pipe(Effect.catchAll(Effect.die)),
      )
      .handle("getById", ({ path }) =>
        Effect.gen(function* () {
          const mockUserId = "mock-user-id" as any;
          yield* Effect.log(
            `[HTTP API] Getting todo ${path.id} for user: ${mockUserId}`,
          );
          const todos = yield* TodosService;
          return yield* todos.getById(path.id, mockUserId);
        }).pipe(Effect.catchAll(Effect.die)),
      )
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          const mockUserId = "mock-user-id" as any;
          yield* Effect.log(`[HTTP API] Creating todo for user: ${mockUserId}`);
          const todos = yield* TodosService;
          return yield* todos.create(payload, mockUserId);
        }).pipe(Effect.catchAll(Effect.die)),
      )
      .handle("update", ({ path, payload }) =>
        Effect.gen(function* () {
          const mockUserId = "mock-user-id" as any;
          yield* Effect.log(
            `[HTTP API] Updating todo ${path.id} for user: ${mockUserId}`,
          );
          const todos = yield* TodosService;
          return yield* todos.update(path.id, payload, mockUserId);
        }).pipe(Effect.catchAll(Effect.die)),
      )
      .handle("remove", ({ path }) =>
        Effect.gen(function* () {
          const mockUserId = "mock-user-id" as any;
          yield* Effect.log(
            `[HTTP API] Removing todo ${path.id} for user: ${mockUserId}`,
          );
          const todos = yield* TodosService;
          return yield* todos.remove(path.id, mockUserId);
        }).pipe(Effect.catchAll(Effect.die)),
      ),
).pipe(Layer.provide(TodosService.Default));
