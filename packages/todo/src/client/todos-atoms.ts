import { serializable } from "@core/client/atom-utils";
import { Atom, Result } from "@effect-atom/atom-react";
import * as RpcClientError from "@effect/rpc/RpcClientError";
import * as Arr from "effect/Array";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import {
  CreateTodoInput,
  Todo,
  TodoId,
  UpdateTodoInput,
} from "../domain/index.js";
import { TodosClient } from "./todos-client.js";

const TodosSchema = Schema.Array(Todo);

// ============================================================================
// Query Atoms
// ============================================================================

type TodosCacheUpdate = Data.TaggedEnum<{
  Upsert: { readonly todo: Todo };
  Delete: { readonly id: TodoId };
}>;

/**
 * Main todos atom with SSR support and optimistic updates.
 *
 * Uses runtime.atom() pattern from reference implementation for full control
 * over the Effect pipeline and proper error type inference.
 */
export const todosAtom = (() => {
  // Remote atom that fetches from the RPC
  const remoteAtom = TodosClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* TodosClient;
        return yield* client("todos_list", undefined);
      })
    )
    .pipe(
      serializable({
        key: "@todo/todos",
        schema: Result.Schema({
          success: TodosSchema,
          error: RpcClientError.RpcClientError,
        }),
      })
    );

  // Writable atom with local cache updates
  return Object.assign(
    Atom.writable(
      (get) => get(remoteAtom),
      (ctx, update: TodosCacheUpdate) => {
        const current = ctx.get(todosAtom);
        if (!Result.isSuccess(current)) return;

        const nextValue = (() => {
          switch (update._tag) {
            case "Upsert": {
              const existingIndex = Arr.findFirstIndex(
                current.value,
                (t) => t.id === update.todo.id
              );
              return Option.match(existingIndex, {
                onNone: () => Arr.prepend(current.value, update.todo),
                onSome: (index) =>
                  Arr.replace(current.value, index, update.todo),
              });
            }
            case "Delete": {
              return Arr.filter(current.value, (t) => t.id !== update.id);
            }
          }
        })();

        ctx.setSelf(Result.success(nextValue));
      },
      (refresh) => {
        refresh(remoteAtom);
      }
    ),
    { remote: remoteAtom }
  );
})();

// ============================================================================
// Mutation Atoms with Optimistic Updates
// ============================================================================

/**
 * Create todo with optimistic cache update.
 */
export const createTodoAtom = TodosClient.runtime.fn<CreateTodoInput>()(
  Effect.fnUntraced(function* (input, get) {
    const client = yield* TodosClient;
    const result = yield* client("todos_create", { input });
    get.set(todosAtom, { _tag: "Upsert", todo: result });
    return result;
  })
);

/**
 * Update todo with optimistic cache update.
 */
export const updateTodoAtom = TodosClient.runtime.fn<{
  readonly id: TodoId;
  readonly input: UpdateTodoInput;
}>()(
  Effect.fnUntraced(function* ({ id, input }, get) {
    const client = yield* TodosClient;
    const result = yield* client("todos_update", { id, input });
    get.set(todosAtom, { _tag: "Upsert", todo: result });
    return result;
  })
);

/**
 * Delete todo with optimistic cache update.
 */
export const deleteTodoAtom = TodosClient.runtime.fn<TodoId>()(
  Effect.fnUntraced(function* (id, get) {
    const client = yield* TodosClient;
    yield* client("todos_remove", { id });
    get.set(todosAtom, { _tag: "Delete", id });
  })
);
