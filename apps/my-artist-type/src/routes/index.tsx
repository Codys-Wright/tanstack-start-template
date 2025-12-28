import { type UserId } from "@auth";
import { BetterAuthService } from "@auth/server";
import { dehydrate } from "../features/core/client";
import { todosAtom } from "@todo";
import { TodosService } from "@todo/server";
import { Result } from "@effect-atom/atom-react";
import { HydrationBoundary } from "@effect-atom/atom-react/ReactHydration";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import { serverRuntime } from "../features/core/server";
import { App } from "./-index/app";

const listTodos = createServerFn({ method: "GET" }).handler(async () => {
  const todos = await serverRuntime.runPromiseExit(
    Effect.gen(function* () {
      const auth = yield* BetterAuthService;
      const service = yield* TodosService;

      // Try to get session, convert error to Option for graceful handling
      const session = yield* auth.getSession.pipe(Effect.option);

      // If not authenticated, return empty array
      if (Option.isNone(session)) {
        return [];
      }

      // Fetch user's todos
      const userId = session.value.user.id as UserId;
      return yield* service.list(userId);
    }).pipe(Effect.orDie),
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
