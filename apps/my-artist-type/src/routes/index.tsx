import { dehydrate } from "../features/core/client";
import { Result } from "@effect-atom/atom-react";
import { HydrationBoundary } from "@effect-atom/atom-react/ReactHydration";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import * as Effect from "effect/Effect";
import { serverRuntime } from "../features/core/server";
import { TodosService } from "../features/todo/server/todos-service";
// import { BetterAuthService } from "@auth";
import { App } from "./-index/app";
// import { todosAtom } from "../features/todo/client/";
// import type { UserId } from "@auth";

const getTodos = createServerFn().handler(async () => {
  const todos = await serverRuntime.runPromiseExit(
    Effect.gen(function* () {
      yield* Effect.log("[getTodos] Starting todos fetch");

      // Auth disabled - return todos for all users
      yield* Effect.log("[getTodos] Auth disabled - returning todos for demo user");

      // Get todos service
      const service = yield* TodosService;
      yield* Effect.log("[getTodos] Got TodosService");

      // For demo purposes, use a fixed user ID or return empty array
      // const userId = "demo-user";
      // const userTodos = yield* service.list(userId);
      // yield* Effect.log(
      //   `[getTodos] Successfully fetched ${userTodos.length} todos`,
      // );

      // return userTodos;

      // Return empty array for now
      yield* Effect.log("[getTodos] Returning empty array (auth disabled)");
      return [];
    }).pipe(
      Effect.tapError((error) =>
        Effect.logError(`[getTodos] Effect error: ${String(error)}`),
      ),
      Effect.tap(() => Effect.log("[getTodos] Effect completed successfully")),
    ),
  );

  Effect.runSync(Effect.log(`[getTodos] Final exit state: ${todos._tag}`));
  // return dehydrate(todosAtom.remote, Result.fromExit(todos));
  // Todo functionality disabled - return empty dehydrated state
  return {};
});

export const Route = createFileRoute("/")({
  loader: () => getTodos(),
  component: AppWrapper,
});

function AppWrapper() {
  const dehydrated = Route.useLoaderData();
  return (
    <HydrationBoundary state={[dehydrated]}>
      <App />
    </HydrationBoundary>
  );
}
