import { dehydrate } from "../features/core/client";
import { Result } from "@effect-atom/atom-react";
import { HydrationBoundary } from "@effect-atom/atom-react/ReactHydration";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import * as Effect from "effect/Effect";
import { serverRuntime } from "../features/core/server";
import { TodosService } from "../features/todo/server/todos-service";
import { App } from "./-index/app";
import { todosAtom } from "../features/todo/client/";

const getTodos = createServerFn().handler(async () => {
  const mockUserId = "mock-user-id" as any;

  const todos = await serverRuntime.runPromiseExit(
    Effect.gen(function* () {
      yield* Effect.log(
        `[getTodos] Fetching todos for mock user: ${mockUserId}`,
      );

      const service = yield* TodosService;
      yield* Effect.log("[getTodos] Got TodosService");

      const userTodos = yield* service.list(mockUserId);
      yield* Effect.log(
        `[getTodos] Successfully fetched ${userTodos.length} todos`,
      );

      return userTodos;
    }).pipe(
      Effect.tapError((error) =>
        Effect.logError(`[getTodos] Effect error: ${String(error)}`),
      ),
      Effect.tap(() => Effect.log("[getTodos] Effect completed successfully")),
    ),
  );

  Effect.runSync(Effect.log(`[getTodos] Final exit state: ${todos._tag}`));
  return dehydrate(todosAtom.remote, Result.fromExit(todos));
});

export const Route = createFileRoute("/")({
  loader: () => getTodos(),
  component: AppWrapper,
});

function AppWrapper() {
  const dehydrated = Route.useLoaderData();
  return (
    <HydrationBoundary state={dehydrated}>
      <App />
    </HydrationBoundary>
  );
}
