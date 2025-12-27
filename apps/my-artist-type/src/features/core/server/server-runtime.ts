import * as ManagedRuntime from "effect/ManagedRuntime";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { TodosService } from "../../todo/server/todos-service";
// import { BetterAuthService } from "@auth";

const memoMap = Effect.runSync(Layer.makeMemoMap);

// Only use TodosService layer (auth disabled)
// const serverLayer = Layer.merge(
//   BetterAuthService.Default,
//   TodosService.Default,
// );
const serverLayer = TodosService.Default;

// ManagedRuntime for use in loaders/server functions
export const serverRuntime = ManagedRuntime.make(serverLayer, memoMap);
