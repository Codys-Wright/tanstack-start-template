import { CurrentUserRpcMiddleware, type UserId } from "./policy.js";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

const STATIC_USER_ID = "00000000-0000-0000-0000-000000000001" as UserId;

export const CurrentUserRpcMiddlewareLive = Layer.succeed(
  CurrentUserRpcMiddleware,
  CurrentUserRpcMiddleware.of(() => Effect.succeed({ userId: STATIC_USER_ID })),
);
