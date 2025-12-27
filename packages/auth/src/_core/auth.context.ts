import * as Context from "effect/Context";
import * as Layer from "effect/Layer";
import type { UserId } from "./../user";

/**
 * Auth context tag - represents the currently authenticated user.
 * Provided by authentication middleware after successful session validation.
 *
 * Usage:
 *   const currentUser = yield* AuthContext;
 *   const userId = currentUser.userId;
 */
export class AuthContext extends Context.Tag("AuthContext")<
  AuthContext,
  { readonly userId: UserId }
>() {
  /**
   * Mock implementation for testing - always returns a static user ID.
   * No database or Better Auth required.
   */
  static Mock = Layer.succeed(this, {
    userId: "00000000-0000-0000-0000-000000000001" as UserId,
  });
}
