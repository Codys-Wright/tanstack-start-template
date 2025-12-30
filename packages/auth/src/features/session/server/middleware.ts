import * as HttpApiError from '@effect/platform/HttpApiError';
import * as HttpApiMiddleware from '@effect/platform/HttpApiMiddleware';
import * as HttpApiSecurity from '@effect/platform/HttpApiSecurity';
import * as HttpServerRequest from '@effect/platform/HttpServerRequest';
import * as RpcMiddleware from '@effect/rpc/RpcMiddleware';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';
import type { UserId } from '@auth/features/user/domain/schema';
import { AuthService } from './service';

// ============================================================================
// Auth Context
// ============================================================================

/**
 * Auth context tag - represents the currently authenticated user.
 * Provided by authentication middleware after successful session validation.
 *
 * Usage:
 *   const currentUser = yield* AuthContext;
 *   const userId = currentUser.userId;
 */
export class AuthContext extends Context.Tag('AuthContext')<
  AuthContext,
  { readonly userId: UserId }
>() {
  /**
   * Mock implementation for testing - always returns a static user ID.
   * No database or Better Auth required.
   */
  static Mock = Layer.succeed(this, {
    userId: '00000000-0000-0000-0000-000000000001' as UserId,
  });

  /**
   * Live implementation that gets the current user from Better Auth session.
   * This is used to satisfy layer type requirements when the actual AuthContext
   * is provided at runtime by the authentication middleware.
   *
   * Note: In practice, the middleware's AuthContext takes precedence per-request.
   */
  static Live = Layer.effect(
    this,
    Effect.gen(function* () {
      const auth = yield* AuthService;
      const session = yield* auth.getSession;
      return { userId: session.user.id as UserId };
    }),
  );
}

// ============================================================================
// HTTP Authentication Middleware
// ============================================================================

/**
 * HTTP API middleware that validates Better Auth session and provides AuthContext.
 * Uses cookie-based authentication to validate sessions with Better Auth.
 */
export class HttpAuthenticationMiddleware extends HttpApiMiddleware.Tag<HttpAuthenticationMiddleware>()(
  'HttpAuthenticationMiddleware',
  {
    failure: HttpApiError.Unauthorized,
    provides: AuthContext,
    security: {
      cookieAuth: HttpApiSecurity.apiKey({
        in: 'cookie',
        key: 'better-auth.session_token',
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
          userId: '00000000-0000-0000-0000-000000000001' as UserId,
        }),
    }),
  );
}

/**
 * Live implementation of HttpAuthenticationMiddleware.
 * Requires AuthService to validate sessions with Better Auth.
 */
export const HttpAuthenticationMiddlewareLive = Layer.effect(
  HttpAuthenticationMiddleware,
  Effect.gen(function* () {
    const auth = yield* AuthService;

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
            forwardedHeaders.set('cookie', headers.cookie);
          }
          if (headers.authorization) {
            forwardedHeaders.set('authorization', headers.authorization);
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

// ============================================================================
// RPC Authentication Middleware
// ============================================================================

/**
 * RPC middleware that validates authentication and provides AuthContext.
 * Used to protect RPC endpoints requiring authenticated users.
 */
export class RpcAuthenticationMiddleware extends RpcMiddleware.Tag<RpcAuthenticationMiddleware>()(
  'RpcAuthenticationMiddleware',
  {
    failure: HttpApiError.Unauthorized,
    provides: AuthContext,
  },
) {}

/**
 * Live implementation of RpcAuthenticationMiddleware.
 * For RPC calls, we attempt to get the session from Better Auth.
 *
 * Note: RPC authentication in SSR context may require different handling
 * depending on whether RPC calls are server-side only or from the browser.
 * Currently this implementation attempts to validate with Better Auth.
 */
export const RpcAuthenticationMiddlewareLive = Layer.effect(
  RpcAuthenticationMiddleware,
  Effect.gen(function* () {
    const auth = yield* AuthService;

    return RpcAuthenticationMiddleware.of((options) =>
      Effect.gen(function* () {
        // Get session from Better Auth using the actual request headers
        const session = yield* Effect.tryPromise({
          try: () => auth.api.getSession({ headers: options.headers }),
          catch: () => new HttpApiError.Unauthorized(),
        });

        if (!session) {
          return yield* Effect.fail(new HttpApiError.Unauthorized());
        }

        // Return AuthContext
        return { userId: session.user.id as UserId };
      }),
    );
  }),
);
