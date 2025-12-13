import * as ManagedRuntime from "effect/ManagedRuntime";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { TodosService } from "@/features/todo/server/todos-service";

const memoMap = Effect.runSync(Layer.makeMemoMap);

// ManagedRuntime for use in loaders/server functions
export const serverRuntime = ManagedRuntime.make(TodosService.Default, memoMap);
