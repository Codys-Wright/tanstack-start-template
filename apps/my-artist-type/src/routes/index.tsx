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
    Effect.flatMap(TodosService, (s) => s.list),
  );
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
