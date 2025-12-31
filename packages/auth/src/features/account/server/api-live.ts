import * as HttpApiBuilder from '@effect/platform/HttpApiBuilder';
import * as HttpServerRequest from '@effect/platform/HttpServerRequest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';
import { AuthApi } from '@auth/core/server/api';
import { AuthService } from '@auth/core/server/service';
import { AuthError, toAuthError, Unauthenticated } from '@auth/features/session/domain/schema';
import { User } from '@auth/features/user/domain/schema';
import {
  ChangeEmailResponse,
  ChangePasswordResponse,
  DeleteAccountResponse,
} from '@auth/features/account/domain/api';

/**
 * AccountApiLive - HTTP API handlers for the account group within AuthApi.
 *
 * Provides handlers for account management operations using Better Auth API.
 * This is composed into AuthApiLive.
 */
export const AccountApiLive = HttpApiBuilder.group(AuthApi, 'account', (handlers) =>
  handlers
    .handle('getProfile', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Account API] Getting profile');
        const auth = yield* AuthService;
        const request = yield* HttpServerRequest.HttpServerRequest;

        const session = yield* Effect.tryPromise({
          try: () => auth.api.getSession({ headers: request.headers }),
          catch: () => new Unauthenticated(),
        });

        if (!session?.user) {
          return yield* Effect.fail(new Unauthenticated());
        }

        // Decode the user from the session using the User schema
        return yield* Schema.decodeUnknown(User)(session.user).pipe(
          Effect.catchAll(() => Effect.fail(new Unauthenticated())),
        );
      }),
    )
    .handle('updateProfile', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Account API] Updating profile', payload);
        const auth = yield* AuthService;
        const request = yield* HttpServerRequest.HttpServerRequest;

        // Verify session first
        const session = yield* Effect.tryPromise({
          try: () => auth.api.getSession({ headers: request.headers }),
          catch: () => new Unauthenticated(),
        });

        if (!session?.user) {
          return yield* Effect.fail(new Unauthenticated());
        }

        // Call Better Auth API to update user profile
        const result = yield* Effect.tryPromise({
          try: () =>
            auth.api.updateUser({
              headers: request.headers,
              body: {
                name: payload.name,
                image: payload.image ?? undefined,
              },
            }),
          catch: toAuthError,
        });

        // The updateUser API returns { status: boolean } on success
        // We need to fetch the updated session to get the user
        if (!result?.status) {
          return yield* Effect.fail(
            new AuthError({
              code: 'UPDATE_FAILED',
              message: 'Failed to update user profile',
            }),
          );
        }

        // Fetch the updated session to get the user data
        const updatedSession = yield* Effect.tryPromise({
          try: () => auth.api.getSession({ headers: request.headers }),
          catch: () => new Unauthenticated(),
        });

        if (!updatedSession?.user) {
          return yield* Effect.fail(new Unauthenticated());
        }

        // Decode and return the updated user
        return yield* Schema.decodeUnknown(User)(updatedSession.user).pipe(
          Effect.catchAll(() =>
            Effect.fail(
              new AuthError({
                code: 'DECODE_FAILED',
                message: 'Failed to decode user',
              }),
            ),
          ),
        );
      }),
    )
    .handle('changeEmail', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Account API] Changing email to', payload.newEmail);
        const auth = yield* AuthService;
        const request = yield* HttpServerRequest.HttpServerRequest;

        // Verify session first
        const session = yield* Effect.tryPromise({
          try: () => auth.api.getSession({ headers: request.headers }),
          catch: () => new Unauthenticated(),
        });

        if (!session?.user) {
          return yield* Effect.fail(new Unauthenticated());
        }

        // Call Better Auth API to change email
        // This will send a verification email if email verification is enabled
        const result = yield* Effect.tryPromise({
          try: () =>
            auth.api.changeEmail({
              headers: request.headers,
              body: {
                newEmail: payload.newEmail,
                callbackURL: payload.callbackURL,
              },
            }),
          catch: toAuthError,
        });

        return new ChangeEmailResponse({
          success: result?.status ?? true,
          message: `Email change request processed for ${payload.newEmail}`,
        });
      }),
    )
    .handle('changePassword', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Account API] Changing password');
        const auth = yield* AuthService;
        const request = yield* HttpServerRequest.HttpServerRequest;

        // Verify session first
        const session = yield* Effect.tryPromise({
          try: () => auth.api.getSession({ headers: request.headers }),
          catch: () => new Unauthenticated(),
        });

        if (!session?.user) {
          return yield* Effect.fail(new Unauthenticated());
        }

        // Call Better Auth API to change password
        yield* Effect.tryPromise({
          try: () =>
            auth.api.changePassword({
              headers: request.headers,
              body: {
                currentPassword: payload.currentPassword,
                newPassword: payload.newPassword,
                revokeOtherSessions: payload.revokeOtherSessions,
              },
            }),
          catch: toAuthError,
        });

        return new ChangePasswordResponse({
          success: true,
        });
      }),
    )
    .handle('deleteAccount', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Account API] Deleting account');
        const auth = yield* AuthService;
        const request = yield* HttpServerRequest.HttpServerRequest;

        // Verify session first
        const session = yield* Effect.tryPromise({
          try: () => auth.api.getSession({ headers: request.headers }),
          catch: () => new Unauthenticated(),
        });

        if (!session?.user) {
          return yield* Effect.fail(new Unauthenticated());
        }

        // Call Better Auth API to delete user
        // Note: This might require password confirmation or send a verification email
        // depending on Better Auth configuration
        const result = yield* Effect.tryPromise({
          try: () =>
            auth.api.deleteUser({
              headers: request.headers,
              body: {},
            }),
          catch: toAuthError,
        });

        return new DeleteAccountResponse({
          success: result?.success ?? true,
        });
      }),
    ),
).pipe(Layer.provide(AuthService.Default));
