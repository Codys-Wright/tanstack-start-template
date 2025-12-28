import { AuthContext } from "@auth/server";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { TodosRpc } from "../domain/index";
import { TodosService } from "./todos-service";

export const TodosRpcLive = TodosRpc.toLayer(
  Effect.gen(function* () {
    const todos = yield* TodosService;

    return TodosRpc.of({
      todos_list: Effect.fn(function* () {
        const auth = yield* AuthContext;
        return yield* todos.list(auth.userId);
      }),

      todos_getById: Effect.fn(function* ({ id }) {
        const auth = yield* AuthContext;
        return yield* todos.getById(auth.userId, id);
      }),

      todos_create: Effect.fn(function* ({ input }) {
        const auth = yield* AuthContext;
        return yield* todos.create(auth.userId, input);
      }),

      todos_update: Effect.fn(function* ({ id, input }) {
        const auth = yield* AuthContext;
        return yield* todos.update(auth.userId, id, input);
      }),

      todos_remove: Effect.fn(function* ({ id }) {
        const auth = yield* AuthContext;
        return yield* todos.remove(auth.userId, id);
      }),
    });
  }),
).pipe(Layer.provide(TodosService.Default));
