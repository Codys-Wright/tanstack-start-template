import { dehydrate } from "@/features/core/client";
import { Result } from "@effect-atom/atom-react";
import { HydrationBoundary } from "@effect-atom/atom-react/ReactHydration";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import * as Effect from "effect/Effect";
import { serverRuntime } from "@/features/core/server";
import { TodosService } from "@/features/todo/server/todos-service";
import { BetterAuthService } from "@/features/auth/server";
import { App } from "./-index/app";
import { todosAtom } from "@/features/todo/client";
import type { UserId } from "@/features/auth/domain/auth.user-id";

const getTodos = createServerFn().handler(async () => {
  const todos = await serverRuntime.runPromiseExit(
    Effect.gen(function* () {
      yield* Effect.log("[getTodos] Starting todos fetch");

      // Get Better Auth service
      const auth = yield* BetterAuthService;
      yield* Effect.log("[getTodos] Got BetterAuthService");

      // Get request headers for session validation
      const requestHeaders = getRequestHeaders();
      const cookieHeader = requestHeaders.get("cookie") || "";
      yield* Effect.log(
        `[getTodos] Got request headers, cookie present: ${!!cookieHeader}`
      );

      // Try to get session with proper headers
      const session = yield* Effect.tryPromise({
        try: () =>
          auth.api.getSession({
            headers: new Headers({
              cookie: cookieHeader,
            }),
          }),
        catch: (error) => error,
      }).pipe(
        Effect.tap(() => Effect.log("[getTodos] Session fetch completed")),
        Effect.tapError((error) =>
          Effect.logError(`[getTodos] Failed to get session: ${String(error)}`)
        )
      );

      yield* Effect.log(
        `[getTodos] Session result: ${
          session ? "authenticated" : "not authenticated"
        }`
      );

      if (!session?.user?.id) {
        yield* Effect.log(
          "[getTodos] No authenticated user, returning empty array"
        );
        return [];
      }

      const userId = session.user.id as UserId;
      yield* Effect.log(`[getTodos] Fetching todos for user: ${userId}`);

      // Get todos service
      const service = yield* TodosService;
      yield* Effect.log("[getTodos] Got TodosService");

      // Fetch todos for this user
      const userTodos = yield* service.list(userId);
      yield* Effect.log(
        `[getTodos] Successfully fetched ${userTodos.length} todos`
      );

      return userTodos;
    }).pipe(
      Effect.tapError((error) =>
        Effect.logError(`[getTodos] Effect error: ${String(error)}`)
      ),
      Effect.tap(() => Effect.log("[getTodos] Effect completed successfully"))
    )
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
    <HydrationBoundary state={[dehydrated]}>
      <App />
    </HydrationBoundary>
  );
}
