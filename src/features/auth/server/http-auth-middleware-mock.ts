import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import type { UserId } from "../domain/user-id.js";
import { AuthenticationHttpMiddleware } from "./http-auth-middleware.js";

const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001" as UserId;

/**
 * Mock implementation of AuthenticationHttpMiddleware for testing.
 * Always succeeds with a static user ID - no database or Better Auth required.
 */
export const AuthenticationHttpMiddlewareMock = Layer.succeed(
  AuthenticationHttpMiddleware,
  AuthenticationHttpMiddleware.of({
    cookieAuth: () => Effect.succeed({ userId: MOCK_USER_ID }),
  }),
);
