import * as HttpApiMiddleware from "@effect/platform/HttpApiMiddleware";
import * as HttpApiSecurity from "@effect/platform/HttpApiSecurity";
import * as HttpServerRequest from "@effect/platform/HttpServerRequest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Schema from "effect/Schema";
import { AuthContext, Unauthorized } from "../domain/auth-context.js";
import type { UserId } from "../policy.js";
import { Auth } from "./service.js";

/**
 * HTTP API middleware that validates Better Auth session and provides AuthContext.
 * Uses cookie-based authentication to validate sessions with Better Auth.
 */
export class AuthorizationMiddleware extends HttpApiMiddleware.Tag<AuthorizationMiddleware>()(
  "AuthorizationMiddleware",
  {
    failure: Unauthorized,
    provides: AuthContext,
    security: {
      cookieAuth: HttpApiSecurity.apiKey({
        in: "cookie",
        key: "better-auth.session_token",
      }),
    },
  },
) {}

/**
 * Live implementation of AuthorizationMiddleware.
 * Requires Auth service to validate sessions with Better Auth.
 */
export const AuthorizationMiddlewareLive = Layer.effect(
  AuthorizationMiddleware,
  Effect.gen(function* () {
    const auth = yield* Auth;

    return AuthorizationMiddleware.of({
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
            Effect.mapError(
              () => new Unauthorized({ details: "Failed to parse headers" }),
            ),
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
            catch: (cause) => new Unauthorized({ details: String(cause) }),
          });

          if (!session) {
            return yield* Effect.fail(
              new Unauthorized({
                details: "Missing or invalid authentication",
              }),
            );
          }

          // Return the authenticated user context value
          // Note: Better Auth user.id is a string, we assert it as UserId
          return AuthContext.of({ userId: session.user.id as UserId });
        }),
    });
  }),
);
