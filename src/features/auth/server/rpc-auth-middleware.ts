import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { AuthContext, Unauthorized } from "../domain/auth-context.js";
import { CurrentUserRpcMiddleware } from "../policy.js";
import type { UserId } from "../policy.js";
import { Auth } from "./service.js";

/**
 * Live implementation of CurrentUserRpcMiddleware.
 * For RPC calls, we attempt to get the session from Better Auth.
 * 
 * Note: RPC authentication in SSR context may require different handling
 * depending on whether RPC calls are server-side only or from the browser.
 * Currently this implementation attempts to validate with Better Auth.
 */
export const CurrentUserRpcMiddlewareLive = Layer.effect(
  CurrentUserRpcMiddleware,
  Effect.gen(function* () {
    const auth = yield* Auth;

    return CurrentUserRpcMiddleware.of(() =>
      Effect.gen(function* () {
        // Attempt to get session from Better Auth
        // In SSR context, this might need to access request headers differently
        const session = yield* Effect.tryPromise({
          try: () => auth.api.getSession({ headers: new Headers() }),
          catch: (cause) => new Unauthorized({ details: String(cause) }),
        });

        if (!session) {
          return yield* Effect.fail(
            new Unauthorized({ details: "Missing or invalid authentication" }),
          );
        }

        // Return authenticated user context
        return AuthContext.of({ userId: session.user.id as UserId });
      }),
    );
  }),
);
