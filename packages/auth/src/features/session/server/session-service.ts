import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { AuthService } from '@auth/core/server/service';
import {
  AuthError,
  toAuthError,
  Unauthenticated,
  SessionData,
  SignInInput,
  SignInResponse,
  SignUpInput,
  SignUpResponse,
  SignOutResponse,
  SocialSignInInput,
  SocialSignInResponse,
  StatusResponse,
  ForgotPasswordInput,
  ResetPasswordInput,
  AnonymousSignInResponse,
} from '../domain/schema';

// ============================================================================
// SessionService
// ============================================================================

/**
 * SessionService - Effect service for session/authentication operations on the server.
 *
 * This is the server-side counterpart to the client atoms. Use this in:
 * - Effect handlers that need to authenticate users
 * - Server-side rendering that needs session data
 * - Background jobs that need to impersonate users
 *
 * For client-side reactive auth state, use the atoms in `client/atoms.ts`.
 *
 * @example
 * ```ts
 * const sessionService = yield* SessionService;
 *
 * // Get current session (requires request headers)
 * const session = yield* sessionService.getSession(request.headers);
 *
 * // Sign in with email/password
 * const response = yield* sessionService.signInEmail({
 *   email: "user@example.com",
 *   password: "password123",
 * }, request.headers);
 * ```
 */
export class SessionService extends Effect.Service<SessionService>()('SessionService', {
  effect: Effect.gen(function* () {
    const auth = yield* AuthService;

    return {
      /**
       * Get the current session from request headers.
       * Returns null if not authenticated.
       */
      getSession: (headers: Headers): Effect.Effect<SessionData, AuthError> =>
        Effect.gen(function* () {
          const response = yield* Effect.tryPromise({
            try: () => auth.api.getSession({ headers }),
            catch: toAuthError,
          });

          return yield* Schema.decodeUnknown(SessionData)(response).pipe(
            Effect.mapError((e) => new AuthError({ message: `Parse error: ${e.message}` })),
          );
        }),

      /**
       * Sign in with email and password.
       */
      signInEmail: (
        input: typeof SignInInput.Type,
        headers: Headers,
      ): Effect.Effect<SignInResponse, AuthError> =>
        Effect.gen(function* () {
          const validated = yield* Schema.decodeUnknown(SignInInput)(input).pipe(
            Effect.mapError((e) => new AuthError({ message: `Validation error: ${e.message}` })),
          );

          const response = yield* Effect.tryPromise({
            try: () =>
              auth.api.signInEmail({
                headers,
                body: {
                  email: validated.email,
                  password: validated.password,
                  callbackURL: validated.callbackURL,
                  rememberMe: validated.rememberMe,
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
            Effect.mapError((e) => new AuthError({ message: `Parse error: ${e.message}` })),
          );
        }),

      /**
       * Sign up with email and password.
       */
      signUpEmail: (
        input: typeof SignUpInput.Type,
        headers: Headers,
      ): Effect.Effect<SignUpResponse, AuthError> =>
        Effect.gen(function* () {
          const validated = yield* Schema.decodeUnknown(SignUpInput)(input).pipe(
            Effect.mapError((e) => new AuthError({ message: `Validation error: ${e.message}` })),
          );

          const response = yield* Effect.tryPromise({
            try: () =>
              auth.api.signUpEmail({
                headers,
                body: {
                  name: validated.name,
                  email: validated.email,
                  password: validated.password,
                  image: validated.image,
                  callbackURL: validated.callbackURL,
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
            Effect.mapError((e) => new AuthError({ message: `Parse error: ${e.message}` })),
          );
        }),

      /**
       * Sign out the current session.
       */
      signOut: (headers: Headers): Effect.Effect<SignOutResponse, AuthError | Unauthenticated> =>
        Effect.gen(function* () {
          const response = yield* Effect.tryPromise({
            try: () => auth.api.signOut({ headers }),
            catch: () => new Unauthenticated(),
          });

          return yield* Schema.decodeUnknown(SignOutResponse)(response ?? { success: true }).pipe(
            Effect.mapError((e) => new AuthError({ message: `Parse error: ${e.message}` })),
          );
        }),

      /**
       * Sign in with a social provider (Google, etc.).
       */
      signInSocial: (
        input: typeof SocialSignInInput.Type,
        headers: Headers,
      ): Effect.Effect<SocialSignInResponse, AuthError> =>
        Effect.gen(function* () {
          const validated = yield* Schema.decodeUnknown(SocialSignInInput)(input).pipe(
            Effect.mapError((e) => new AuthError({ message: `Validation error: ${e.message}` })),
          );

          const response = yield* Effect.tryPromise({
            try: () =>
              auth.api.signInSocial({
                headers,
                body: {
                  provider: validated.provider,
                  callbackURL: validated.callbackURL,
                  errorCallbackURL: validated.errorCallbackURL,
                  newUserCallbackURL: validated.newUserCallbackURL,
                  disableRedirect: validated.disableRedirect,
                  scopes: validated.scopes,
                  requestSignUp: validated.requestSignUp,
                  loginHint: validated.loginHint,
                  idToken: validated.idToken,
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
            Effect.mapError((e) => new AuthError({ message: `Parse error: ${e.message}` })),
          );
        }),

      /**
       * Sign in anonymously (creates a temporary user).
       */
      signInAnonymous: (headers: Headers): Effect.Effect<AnonymousSignInResponse, AuthError> =>
        Effect.gen(function* () {
          // Anonymous plugin method
          const response = yield* Effect.tryPromise({
            try: () => (auth.api as any).signInAnonymous({ headers }),
            catch: toAuthError,
          });

          if (!response || (response as { error?: unknown }).error) {
            return yield* Effect.fail(
              toAuthError((response as { error?: unknown })?.error ?? 'Anonymous sign in failed'),
            );
          }

          return yield* Schema.decodeUnknown(AnonymousSignInResponse)(response).pipe(
            Effect.mapError((e) => new AuthError({ message: `Parse error: ${e.message}` })),
          );
        }),

      /**
       * Request a password reset email.
       */
      forgotPassword: (
        input: typeof ForgotPasswordInput.Type,
        headers: Headers,
      ): Effect.Effect<StatusResponse, AuthError> =>
        Effect.gen(function* () {
          const validated = yield* Schema.decodeUnknown(ForgotPasswordInput)(input).pipe(
            Effect.mapError((e) => new AuthError({ message: `Validation error: ${e.message}` })),
          );

          // Better Auth's forgetPassword is only typed when sendResetPassword is configured
          const response = yield* Effect.tryPromise({
            try: () =>
              (auth.api as any).forgetPassword({
                headers,
                body: {
                  email: validated.email,
                  redirectTo: validated.redirectTo,
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
            Effect.mapError((e) => new AuthError({ message: `Parse error: ${e.message}` })),
          );
        }),

      /**
       * Reset password with a token from the reset email.
       */
      resetPassword: (
        input: typeof ResetPasswordInput.Type,
        headers: Headers,
      ): Effect.Effect<StatusResponse, AuthError> =>
        Effect.gen(function* () {
          const validated = yield* Schema.decodeUnknown(ResetPasswordInput)(input).pipe(
            Effect.mapError((e) => new AuthError({ message: `Validation error: ${e.message}` })),
          );

          const response = yield* Effect.tryPromise({
            try: () =>
              auth.api.resetPassword({
                headers,
                body: {
                  newPassword: validated.newPassword,
                  token: validated.token ?? undefined,
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
            Effect.mapError((e) => new AuthError({ message: `Parse error: ${e.message}` })),
          );
        }),
    };
  }),
  dependencies: [AuthService.Default],
}) {}
