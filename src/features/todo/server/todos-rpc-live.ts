import * as Layer from "effect/Layer";
import * as Effect from "effect/Effect";
import { Authentication } from "@/features/auth";
import { TodosRpc } from "../domain/todo-rpc";
import { TodosService } from "./todos-service";

export const TodosRpcLive = TodosRpc.toLayer(
  Effect.gen(function* () {
    const todos = yield* TodosService;

    return TodosRpc.of({
      todos_list: () =>
        Effect.gen(function* () {
          const currentUser = yield* Authentication;
          yield* Effect.log(
            `[RPC] Listing todos for user: ${currentUser.userId}`,
          );
          return yield* todos.list;
        }),

      todos_getById: ({ id }) =>
        Effect.gen(function* () {
          const currentUser = yield* Authentication;
          yield* Effect.log(
            `[RPC] Getting todo ${id} for user: ${currentUser.userId}`,
          );
          return yield* todos.getById(id);
        }),

      todos_create: ({ input }) =>
        Effect.gen(function* () {
          const currentUser = yield* Authentication;
          yield* Effect.log(
            `[RPC] Creating todo for user: ${currentUser.userId}`,
          );
          console.log("hello");
          return yield* todos.create(input);
        }),

      todos_update: ({ id, input }) =>
        Effect.gen(function* () {
          const currentUser = yield* Authentication;
          yield* Effect.log(
            `[RPC] Updating todo ${id} for user: ${currentUser.userId}`,
          );
          return yield* todos.update(id, input);
        }),

      todos_remove: ({ id }) =>
        Effect.gen(function* () {
          const currentUser = yield* Authentication;
          yield* Effect.log(
            `[RPC] Removing todo ${id} for user: ${currentUser.userId}`,
          );
          return yield* todos.remove(id);
        }),
    });
  }),
).pipe(Layer.provide(TodosService.Default));
