import * as HttpApiError from "@effect/platform/HttpApiError";
import * as HttpApiMiddleware from "@effect/platform/HttpApiMiddleware";
import * as HttpApiSecurity from "@effect/platform/HttpApiSecurity";
import * as HttpServerRequest from "@effect/platform/HttpServerRequest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Schema from "effect/Schema";
import { AuthContext } from "./auth.context.js";
import type { UserId } from "./../user";
import { BetterAuthService } from "./better-auth.service.js";

/**
 * HTTP API middleware that validates Better Auth session and provides AuthContext.
 * Uses cookie-based authentication to validate sessions with Better Auth.
 */
export class HttpAuthenticationMiddleware extends HttpApiMiddleware.Tag<HttpAuthenticationMiddleware>()(
  "HttpAuthenticationMiddleware",
  {
    failure: HttpApiError.Unauthorized,
    provides: AuthContext,
    security: {
      cookieAuth: HttpApiSecurity.apiKey({
        in: "cookie",
        key: "better-auth.session_token",
      }),
    },
  },
) {
  /**
   * Mock implementation for testing - always returns a static user ID.
   * No database or Better Auth required.
   */
  static Mock = Layer.succeed(
    this,
    this.of({
      cookieAuth: () =>
        Effect.succeed({
          userId: "00000000-0000-0000-0000-000000000001" as UserId,
        }),
    }),
  );
}

/**
 * Live implementation of HttpAuthenticationMiddleware.
 * Requires BetterAuthService to validate sessions with Better Auth.
 */
export const HttpAuthenticationMiddlewareLive = Layer.effect(
  HttpAuthenticationMiddleware,
  Effect.gen(function* () {
    const auth = yield* BetterAuthService;

    return HttpAuthenticationMiddleware.of({
      // Handler for cookie-based authentication
      cookieAuth: () =>
        Effect.gen(function* () {
          // Extract headers from HTTP request
          const headers = yield* HttpServerRequest.schemaHeaders(
            Schema.Struct({
              cookie: Schema.optional(Schema.String),
              authorization: Schema.optional(Schema.String),
            }),
          ).pipe(Effect.mapError(() => new HttpApiError.Unauthorized()));

          // Forward to Better Auth
          const forwardedHeaders = new Headers();
          if (headers.cookie) {
            forwardedHeaders.set("cookie", headers.cookie);
          }
          if (headers.authorization) {
            forwardedHeaders.set("authorization", headers.authorization);
          }

          // Get session from Better Auth
          const session = yield* Effect.tryPromise({
            try: () => auth.api.getSession({ headers: forwardedHeaders }),
            catch: () => new HttpApiError.Unauthorized(),
          });

          if (!session) {
            return yield* Effect.fail(new HttpApiError.Unauthorized());
          }

          // Return AuthContext
          return { userId: session.user.id as UserId };
        }),
    });
  }),
);
