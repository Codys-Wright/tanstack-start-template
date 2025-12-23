import * as HttpApiError from "@effect/platform/HttpApiError";
import * as HttpApiMiddleware from "@effect/platform/HttpApiMiddleware";
import * as HttpApiSecurity from "@effect/platform/HttpApiSecurity";
import * as HttpServerRequest from "@effect/platform/HttpServerRequest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Schema from "effect/Schema";
import { Authentication } from "../domain/authentication.js";
import type { UserId } from "../domain/user-id.js";
import { Auth } from "./service.js";

/**
 * HTTP API middleware that validates Better Auth session and provides Authentication context.
 * Uses cookie-based authentication to validate sessions with Better Auth.
 */
export class AuthenticationHttpMiddleware extends HttpApiMiddleware.Tag<AuthenticationHttpMiddleware>()(
  "AuthenticationHttpMiddleware",
  {
    failure: HttpApiError.Unauthorized,
    provides: Authentication,
    security: {
      cookieAuth: HttpApiSecurity.apiKey({
        in: "cookie",
        key: "better-auth.session_token",
      }),
    },
  },
) {}

/**
 * Live implementation of AuthenticationHttpMiddleware.
 * Requires Auth service to validate sessions with Better Auth.
 */
export const AuthenticationHttpMiddlewareLive = Layer.effect(
  AuthenticationHttpMiddleware,
  Effect.gen(function* () {
    const auth = yield* Auth;

    return AuthenticationHttpMiddleware.of({
      // Handler for cookie-based authentication
      cookieAuth: () =>
        Effect.gen(function* () {
          // Extract headers from HTTP request
          const headers = yield* HttpServerRequest.schemaHeaders(
            Schema.Struct({
              cookie: Schema.optional(Schema.String),
              authorization: Schema.optional(Schema.String),
            }),
          ).pipe(
            Effect.mapError(() => new HttpApiError.Unauthorized()),
          );

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

          // Return Authentication context
          return { userId: session.user.id as UserId };
        }),
    });
  }),
);
