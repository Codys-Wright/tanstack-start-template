import { AuthService } from "@auth/server";
import { TodosService } from "@todo/server";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as ManagedRuntime from "effect/ManagedRuntime";

const memoMap = Effect.runSync(Layer.makeMemoMap);

// Merge AuthService and TodosService layers
const serverLayer = Layer.merge(
  AuthService.Default,
  TodosService.Default,
);

// ManagedRuntime for use in loaders/server functions
export const serverRuntime = ManagedRuntime.make(serverLayer, memoMap);
