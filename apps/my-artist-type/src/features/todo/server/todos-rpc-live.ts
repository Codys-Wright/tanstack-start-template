import * as Layer from "effect/Layer";
import * as Effect from "effect/Effect";
import { TodosRpc } from "../domain/todo-rpc";
import { TodosService } from "./todos-service";

const mockUserId = "mock-user-id" as any;

export const TodosRpcLive = TodosRpc.toLayer(
  Effect.gen(function* () {
    const todos = yield* TodosService;

    return TodosRpc.of({
      todos_list: () =>
        Effect.gen(function* () {
          yield* Effect.log(`[RPC] Listing todos for user: ${mockUserId}`);
          return yield* todos.list(mockUserId);
        }).pipe(Effect.catchAll(Effect.die)),

      todos_getById: ({ id }) =>
        Effect.gen(function* () {
          yield* Effect.log(`[RPC] Getting todo ${id} for user: ${mockUserId}`);
          return yield* todos.getById(id, mockUserId);
        }).pipe(Effect.catchAll(Effect.die)),

      todos_create: ({ input }) =>
        Effect.gen(function* () {
          yield* Effect.log(`[RPC] Creating todo for user: ${mockUserId}`);
          return yield* todos.create(input, mockUserId);
        }).pipe(Effect.catchAll(Effect.die)),

      todos_update: ({ id, input }) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `[RPC] Updating todo ${id} for user: ${mockUserId}`,
          );
          return yield* todos.update(id, input, mockUserId);
        }).pipe(Effect.catchAll(Effect.die)),

      todos_remove: ({ id }) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `[RPC] Removing todo ${id} for user: ${mockUserId}`,
          );
          return yield* todos.remove(id, mockUserId);
        }).pipe(Effect.catchAll(Effect.die)),
    });
  }),
).pipe(Layer.provide(TodosService.Default));
