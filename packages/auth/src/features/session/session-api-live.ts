import * as HttpApiBuilder from '@effect/platform/HttpApiBuilder';
import * as HttpServerRequest from '@effect/platform/HttpServerRequest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';
import { AuthApi } from '@auth/core/auth-api';
import {
  AuthError,
  SessionData,
  toAuthError,
  Unauthenticated,
  SignInResponse,
  SignUpResponse,
  SignOutResponse,
  SocialSignInResponse,
  StatusResponse,
  VerifyEmailResponse,
  LinkSocialResponse,
  AnonymousSignInResponse,
} from '@auth/features/session/domain/schema';
import { AuthService } from '@auth/core/server/service';

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
    )
    .handle('signInSocial', ({ payload }) =>
      Effect.gen(function* () {
        const auth = yield* AuthService;
        const request = yield* HttpServerRequest.HttpServerRequest;

        const response = yield* Effect.tryPromise({
          try: () =>
            auth.api.signInSocial({
              headers: request.headers,
              body: {
                provider: payload.provider,
                callbackURL: payload.callbackURL ?? undefined,
                errorCallbackURL: payload.errorCallbackURL ?? undefined,
                newUserCallbackURL: payload.newUserCallbackURL ?? undefined,
                disableRedirect: payload.disableRedirect ?? undefined,
                scopes: payload.scopes ?? undefined,
                requestSignUp: payload.requestSignUp ?? undefined,
                loginHint: payload.loginHint ?? undefined,
                idToken: payload.idToken ?? undefined,
              },
            }),
          catch: toAuthError,
        });

        if (!response || (response as { error?: unknown }).error) {
          return yield* Effect.fail(
            toAuthError((response as { error?: unknown })?.error ?? 'Social sign in failed'),
          );
        }

        return yield* Schema.decodeUnknown(SocialSignInResponse)(response).pipe(
          Effect.mapError((e) => new AuthError({ message: `Parse error: ${e}` })),
        );
      }),
    )
    .handle('signInAnonymous', () =>
      Effect.gen(function* () {
        const auth = yield* AuthService;
        const request = yield* HttpServerRequest.HttpServerRequest;

        const response = yield* Effect.tryPromise({
          try: () =>
            auth.api.signInAnonymous({
              headers: request.headers,
            }),
          catch: toAuthError,
        });

        if (!response || (response as { error?: unknown }).error) {
          return yield* Effect.fail(
            toAuthError((response as { error?: unknown })?.error ?? 'Anonymous sign in failed'),
          );
        }

        return yield* Schema.decodeUnknown(AnonymousSignInResponse)(response).pipe(
          Effect.mapError((e) => new AuthError({ message: `Parse error: ${e}` })),
        );
      }),
    )
    .handle('sendVerificationEmail', ({ payload }) =>
      Effect.gen(function* () {
        const auth = yield* AuthService;
        const request = yield* HttpServerRequest.HttpServerRequest;

        const response = yield* Effect.tryPromise({
          try: () =>
            auth.api.sendVerificationEmail({
              headers: request.headers,
              body: {
                email: payload.email,
                callbackURL: payload.callbackURL ?? undefined,
              },
            }),
          catch: toAuthError,
        });

        if (!response || (response as { error?: unknown }).error) {
          return yield* Effect.fail(
            toAuthError(
              (response as { error?: unknown })?.error ?? 'Send verification email failed',
            ),
          );
        }

        return yield* Schema.decodeUnknown(StatusResponse)(response).pipe(
          Effect.mapError((e) => new AuthError({ message: `Parse error: ${e}` })),
        );
      }),
    )
    .handle('verifyEmail', ({ urlParams }) =>
      Effect.gen(function* () {
        const auth = yield* AuthService;
        const request = yield* HttpServerRequest.HttpServerRequest;

        const response = yield* Effect.tryPromise({
          try: () =>
            auth.api.verifyEmail({
              headers: request.headers,
              query: {
                token: urlParams.token,
                callbackURL: urlParams.callbackURL,
              },
            }),
          catch: toAuthError,
        });

        if (!response || (response as { error?: unknown }).error) {
          return yield* Effect.fail(
            toAuthError((response as { error?: unknown })?.error ?? 'Verify email failed'),
          );
        }

        return yield* Schema.decodeUnknown(VerifyEmailResponse)(response).pipe(
          Effect.mapError((e) => new AuthError({ message: `Parse error: ${e}` })),
        );
      }),
    )
    .handle('forgotPassword', ({ payload }) =>
      Effect.gen(function* () {
        const auth = yield* AuthService;
        const request = yield* HttpServerRequest.HttpServerRequest;

        // Better Auth's forgetPassword is only typed when sendResetPassword is configured.
        // At runtime it exists because our real config includes sendResetPassword.
        const response = yield* Effect.tryPromise({
          try: () =>
            (auth.api as any).forgetPassword({
              headers: request.headers,
              body: {
                email: payload.email,
                redirectTo: payload.redirectTo,
              },
            }),
          catch: toAuthError,
        });

        if (!response || (response as { error?: unknown }).error) {
          return yield* Effect.fail(
            toAuthError((response as { error?: unknown })?.error ?? 'Forgot password failed'),
          );
        }

        return yield* Schema.decodeUnknown(StatusResponse)(response).pipe(
          Effect.mapError((e) => new AuthError({ message: `Parse error: ${e}` })),
        );
      }),
    )
    .handle('resetPassword', ({ payload }) =>
      Effect.gen(function* () {
        const auth = yield* AuthService;
        const request = yield* HttpServerRequest.HttpServerRequest;

        const response = yield* Effect.tryPromise({
          try: () =>
            auth.api.resetPassword({
              headers: request.headers,
              body: {
                newPassword: payload.newPassword,
                token: payload.token ?? undefined,
              },
            }),
          catch: toAuthError,
        });

        if (!response || (response as { error?: unknown }).error) {
          return yield* Effect.fail(
            toAuthError((response as { error?: unknown })?.error ?? 'Reset password failed'),
          );
        }

        return yield* Schema.decodeUnknown(StatusResponse)(response).pipe(
          Effect.mapError((e) => new AuthError({ message: `Parse error: ${e}` })),
        );
      }),
    )
    .handle('linkSocial', ({ payload }) =>
      Effect.gen(function* () {
        const auth = yield* AuthService;
        const request = yield* HttpServerRequest.HttpServerRequest;

        // Better Auth uses 'linkSocialAccount' as the method name (not 'linkSocial')
        const response = yield* Effect.tryPromise({
          try: () =>
            auth.api.linkSocialAccount({
              headers: request.headers,
              body: {
                provider: payload.provider,
                callbackURL: payload.callbackURL ?? undefined,
                errorCallbackURL: payload.errorCallbackURL ?? undefined,
                disableRedirect: payload.disableRedirect ?? undefined,
                scopes: payload.scopes ?? undefined,
                idToken: payload.idToken ?? undefined,
              },
            }),
          catch: (e) => {
            const err = toAuthError(e);
            if (
              err.message.toLowerCase().includes('unauthorized') ||
              err.message.toLowerCase().includes('unauthenticated')
            ) {
              return new Unauthenticated();
            }
            return err;
          },
        });

        if (!response || (response as { error?: unknown }).error) {
          return yield* Effect.fail(
            toAuthError((response as { error?: unknown })?.error ?? 'Link social failed'),
          );
        }

        return yield* Schema.decodeUnknown(LinkSocialResponse)(response).pipe(
          Effect.mapError((e) => new AuthError({ message: `Parse error: ${e}` })),
        );
      }),
    ),
).pipe(Layer.provide(AuthService.Default));
