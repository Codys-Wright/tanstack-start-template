import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import type { UserId } from "../domain/user-id.js";
import { AuthenticationRpcMiddleware } from "../policy.js";

const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001" as UserId;

/**
 * Mock implementation of AuthenticationRpcMiddleware for testing.
 * Always succeeds with a static user ID - no database or Better Auth required.
 */
export const AuthenticationRpcMiddlewareMock = Layer.succeed(
  AuthenticationRpcMiddleware,
  AuthenticationRpcMiddleware.of(() =>
    Effect.gen(function* () {
      yield* Effect.log("[RPC Middleware] Mock authentication middleware called");
      yield* Effect.log(`[RPC Middleware] Providing userId: ${MOCK_USER_ID}`);
      return { userId: MOCK_USER_ID };
    }),
  ),
);
