import { CurrentUser, type UserId } from "./policy.js";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

const STATIC_USER_ID = "00000000-0000-0000-0000-000000000001" as UserId;

export class UserService extends Effect.Service<UserService>()("UserService", {
  effect: Effect.gen(function* () {
    return CurrentUser.of({ userId: STATIC_USER_ID });
  }),
}) {}

// Layer that provides CurrentUser directly (for use in services)
export const CurrentUserLive = Layer.succeed(
  CurrentUser,
  CurrentUser.of({ userId: STATIC_USER_ID }),
);

