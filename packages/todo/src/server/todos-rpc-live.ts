import * as Layer from "effect/Layer";
import * as Effect from "effect/Effect";
import { TodosRpc } from "../domain/index.js";
import { TodosService } from "./todos-service.js";

export const TodosRpcLive = TodosRpc.toLayer(
  Effect.gen(function* () {
    const todos = yield* TodosService;

    return {
      todos_list: () => todos.list,

      todos_getById: ({ id }) => todos.getById(id),

      todos_create: ({ input }) => todos.create(input),

      todos_update: ({ id, input }) => todos.update(id, input),

      todos_remove: ({ id }) => todos.remove(id),
    };
  }),
).pipe(Layer.provide(TodosService.Default));
