import { type UserId } from "@auth";
import { BetterAuthService } from "@auth/server";
import { dehydrate } from "../features/core/client";
import { todosAtom } from "@todo";
import { TodosService } from "@todo/server";
import { Result } from "@effect-atom/atom-react";
import { HydrationBoundary } from "@effect-atom/atom-react/ReactHydration";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import * as Effect from "effect/Effect";
import { serverRuntime } from "../features/core/server";
import { App } from "./-index/app";

const listTodos = createServerFn({ method: "GET" }).handler(async () => {
  const todos = await serverRuntime.runPromiseExit(
    Effect.gen(function* () {
      const auth = yield* BetterAuthService;
      const service = yield* TodosService;

      // Get request headers (synchronous in TanStack Start)
      const headers = getRequestHeaders();

      // Try to get session from Better Auth, catch errors and return null
      const session = yield* Effect.tryPromise({
        try: () => auth.api.getSession({ headers }),
        catch: () => new Error("Failed to get session"),
      }).pipe(
        Effect.catchAll(() =>
          Effect.gen(function* () {
            yield* Effect.logInfo("[listTodos] Session error - returning null");
            return null;
          }),
        ),
      );

      // If not authenticated, return empty array
      if (!session) {
        yield* Effect.logInfo("[listTodos] No session - returning empty todos");
        return [];
      }

      // Fetch user's todos
      const userId = session.user.id as UserId;
      yield* Effect.logInfo(
        `[listTodos] Authenticated user ${userId} - fetching todos`,
      );

      const todos = yield* service.list(userId);
      yield* Effect.logInfo(`[listTodos] Retrieved ${todos.length} todos`);

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
