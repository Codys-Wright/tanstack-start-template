import * as ManagedRuntime from "effect/ManagedRuntime";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { TodosService } from "@/features/todo/server/todos-service";
import { BetterAuthService } from "@auth";

const memoMap = Effect.runSync(Layer.makeMemoMap);

// Merge BetterAuthService and TodosService layers
const serverLayer = Layer.merge(
  BetterAuthService.Default,
  TodosService.Default
);

// ManagedRuntime for use in loaders/server functions
export const serverRuntime = ManagedRuntime.make(serverLayer, memoMap);
