import * as HttpApiBuilder from '@effect/platform/HttpApiBuilder';
import * as HttpServerRequest from '@effect/platform/HttpServerRequest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';
import { AuthApi } from '../_core/auth-api.js';
import {
  AuthError,
  SessionData,
  toAuthError,
  Unauthenticated,
  SignInResponse,
  SignUpResponse,
  SignOutResponse,
} from './domain/schema.js';
import { AuthService } from '../_core/service.js';

/**
 * SessionApiLive - HTTP API handlers for the session group within AuthApi.
 *
 * Uses AuthApi directly - no complex generics or type casting needed.
 * This is composed into AuthApiLive and used with HttpLayerRouter.addHttpApi(AuthApi).
 *
 * @example
 * ```ts
 * import { AuthApi } from "@auth";
 * import { AuthApiLive } from "@auth/server";
 * import * as HttpLayerRouter from "@effect/platform/HttpLayerRouter";
 *
 * const AuthRoutes = HttpLayerRouter.addHttpApi(AuthApi).pipe(
 *   Layer.provide(AuthApiLive)
 * );
 * ```
 */
export const SessionApiLive = HttpApiBuilder.group(AuthApi, 'session', (handlers) =>
  handlers
    .handle('getSession', () =>
      Effect.gen(function* () {
        const auth = yield* AuthService;
        const request = yield* HttpServerRequest.HttpServerRequest;
        const headers = request.headers;

        const response = yield* Effect.tryPromise({
          try: () => auth.api.getSession({ headers }),
          catch: () => new Error('Failed to get session'),
        }).pipe(Effect.orElseSucceed(() => null));

        if (!response) {
          return null;
        }

        return yield* Schema.decodeUnknown(SessionData)(response).pipe(
          Effect.orElseSucceed(() => null),
        );
      }),
    )
    .handle('signInEmail', ({ payload }) =>
      Effect.gen(function* () {
        const auth = yield* AuthService;
        const request = yield* HttpServerRequest.HttpServerRequest;

        const response = yield* Effect.tryPromise({
          try: () =>
            auth.api.signInEmail({
              headers: request.headers,
              body: {
                email: payload.email,
                password: payload.password,
                callbackURL: payload.callbackURL,
                rememberMe: payload.rememberMe,
              },
            }),
          catch: toAuthError,
        });

        if (!response || (response as { error?: unknown }).error) {
          return yield* Effect.fail(
            toAuthError((response as { error?: unknown })?.error ?? 'Sign in failed'),
          );
        }

        return yield* Schema.decodeUnknown(SignInResponse)(response).pipe(
          Effect.mapError((e) => new AuthError({ message: `Parse error: ${e}` })),
        );
      }),
    )
    .handle('signUpEmail', ({ payload }) =>
      Effect.gen(function* () {
        const auth = yield* AuthService;
        const request = yield* HttpServerRequest.HttpServerRequest;

        const response = yield* Effect.tryPromise({
          try: () =>
            auth.api.signUpEmail({
              headers: request.headers,
              body: {
                name: payload.name,
                email: payload.email,
                password: payload.password,
                image: payload.image,
                callbackURL: payload.callbackURL,
              },
            }),
          catch: toAuthError,
        });

        if (!response || (response as { error?: unknown }).error) {
          return yield* Effect.fail(
            toAuthError((response as { error?: unknown })?.error ?? 'Sign up failed'),
          );
        }

        return yield* Schema.decodeUnknown(SignUpResponse)(response).pipe(
          Effect.mapError((e) => new AuthError({ message: `Parse error: ${e}` })),
        );
      }),
    )
    .handle('signOut', () =>
      Effect.gen(function* () {
        const auth = yield* AuthService;
        const request = yield* HttpServerRequest.HttpServerRequest;

        const response = yield* Effect.tryPromise({
          try: () => auth.api.signOut({ headers: request.headers }),
          catch: () => new Unauthenticated(),
        });

        return yield* Schema.decodeUnknown(SignOutResponse)(response ?? { success: true }).pipe(
          Effect.mapError(() => new Unauthenticated()),
        );
      }),
    ),
).pipe(Layer.provide(AuthService.Default));
