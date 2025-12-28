import { AuthService } from "@auth/server";
import { dehydrate } from "../features/core/client";
import { todosAtom } from "@todo";
import { TodosService } from "@todo/server";
import { Result } from "@effect-atom/atom-react";
import { HydrationBoundary } from "@effect-atom/atom-react/ReactHydration";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import * as Effect from "effect/Effect";
import { serverRuntime } from "../features/core/server";
import { App } from "./-index/app";

const listTodos = createServerFn({ method: "GET" }).handler(async () => {
  const todos = await serverRuntime.runPromiseExit(
    Effect.gen(function* () {
      const auth = yield* AuthService;
      const service = yield* TodosService;

      // Get user ID from request headers (automatically retrieved)
      const userId = yield* auth.getUserIdFromHeaders();

      // If not authenticated, return empty array
      if (!userId) {
        yield* Effect.logInfo("[listTodos] No session - returning empty todos");
        return [];
      }

      const todos = yield* service.list(userId);
      return todos;
    }),
  );

  // Convert Exit to Result - handles Success/Failure properly
  return dehydrate(todosAtom.remote, Result.fromExit(todos));
});

export const Route = createFileRoute("/")({
  loader: () => listTodos(),
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
