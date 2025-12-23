import * as HttpApiError from "@effect/platform/HttpApiError";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import type { UserId } from "../domain/user-id.js";
import { AuthenticationRpcMiddleware } from "../policy.js";
import { Auth } from "./service.js";

/**
 * Live implementation of AuthenticationRpcMiddleware.
 * For RPC calls, we attempt to get the session from Better Auth.
 * 
 * Note: RPC authentication in SSR context may require different handling
 * depending on whether RPC calls are server-side only or from the browser.
 * Currently this implementation attempts to validate with Better Auth.
 */
export const AuthenticationRpcMiddlewareLive = Layer.effect(
  AuthenticationRpcMiddleware,
  Effect.gen(function* () {
    const auth = yield* Auth;

    return AuthenticationRpcMiddleware.of((options) =>
      Effect.gen(function* () {
        // Get session from Better Auth using the actual request headers
        const session = yield* Effect.tryPromise({
          try: () => auth.api.getSession({ headers: options.headers }),
          catch: () => new HttpApiError.Unauthorized(),
        });

        if (!session) {
          return yield* Effect.fail(new HttpApiError.Unauthorized());
        }

        // Return Authentication context
        return { userId: session.user.id as UserId };
      }),
    );
  }),
);
