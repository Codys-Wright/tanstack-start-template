import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { AuthService } from '@auth/core/server/service';
import { AuthError, toAuthError, Unauthenticated } from '@auth/features/session/domain/schema';
import { User } from '../domain/schema';

// ============================================================================
// Input Schemas
// ============================================================================

/**
 * Input for updating the current user's profile
 */
export const UpdateUserInput = Schema.Struct({
  name: Schema.optional(Schema.String),
  image: Schema.optional(Schema.String),
});
export type UpdateUserInput = typeof UpdateUserInput.Type;

/**
 * Input for deleting the current user's account
 */
export const DeleteUserInput = Schema.Struct({
  callbackURL: Schema.optional(Schema.String),
  password: Schema.optional(Schema.String),
  token: Schema.optional(Schema.String),
});
export type DeleteUserInput = typeof DeleteUserInput.Type;

// ============================================================================
// UserService
// ============================================================================

/**
 * UserService - Effect service for user-related operations.
 *
 * Provides methods for:
 * - Updating the current user's profile
 * - Deleting the current user's account
 *
 * Note: Admin user operations (list users, get user by ID, etc.) are in AdminService.
 *
 * @example
 * ```ts
 * const userService = yield* UserService;
 *
 * // Update current user's profile
 * const updatedUser = yield* userService.updateProfile({ name: "New Name" });
 *
 * // Delete current user's account
 * yield* userService.deleteAccount({ password: "current-password" });
 * ```
 */
export class UserService extends Effect.Service<UserService>()('UserService', {
  effect: Effect.gen(function* () {
    const auth = yield* AuthService;

    return {
      /**
       * Update the current user's profile.
       * Requires authentication.
       *
       * @param input - Fields to update (name, image)
       * @param headers - Optional request headers for authentication
       * @returns Updated user
       */
      updateProfile: (
        input: UpdateUserInput,
        headers?: Headers,
      ): Effect.Effect<User, AuthError | Unauthenticated> =>
        Effect.gen(function* () {
          // Validate input
          const validated = yield* Schema.decodeUnknown(UpdateUserInput)(input).pipe(
            Effect.mapError((e) => new AuthError({ message: `Validation error: ${e.message}` })),
          );

          // Call Better Auth API
          const response = yield* Effect.tryPromise({
            try: () =>
              auth.api.updateUser({
                headers: headers ?? new Headers(),
                body: {
                  name: validated.name,
                  image: validated.image,
                },
              }),
            catch: (e) => {
              const err = toAuthError(e);
              if (err.message.toLowerCase().includes('unauthorized')) {
                return new Unauthenticated();
              }
              return err;
            },
          });

          if (!response || (response as { error?: unknown }).error) {
            return yield* Effect.fail(
              toAuthError((response as { error?: unknown })?.error ?? 'Update failed'),
            );
          }

          // Decode response to User
          // Better Auth returns { user: User } or just status depending on operation
          const userData = (response as { user?: unknown }).user ?? response;
          return yield* Schema.decodeUnknown(User)(userData).pipe(
            Effect.mapError((e) => new AuthError({ message: `Parse error: ${e.message}` })),
          );
        }),

      /**
       * Delete the current user's account.
       * Requires authentication and optionally password confirmation.
       *
       * @param input - Delete options (callbackURL, password for confirmation)
       * @param headers - Optional request headers for authentication
       */
      deleteAccount: (
        input: DeleteUserInput = {},
        headers?: Headers,
      ): Effect.Effect<void, AuthError | Unauthenticated> =>
        Effect.gen(function* () {
          // Validate input
          const validated = yield* Schema.decodeUnknown(DeleteUserInput)(input).pipe(
            Effect.mapError((e) => new AuthError({ message: `Validation error: ${e.message}` })),
          );

          // Call Better Auth API
          const response = yield* Effect.tryPromise({
            try: () =>
              auth.api.deleteUser({
                headers: headers ?? new Headers(),
                body: {
                  callbackURL: validated.callbackURL,
                  password: validated.password,
                  token: validated.token,
                },
              }),
            catch: (e) => {
              const err = toAuthError(e);
              if (err.message.toLowerCase().includes('unauthorized')) {
                return new Unauthenticated();
              }
              return err;
            },
          });

          if (!response || (response as { error?: unknown }).error) {
            return yield* Effect.fail(
              toAuthError((response as { error?: unknown })?.error ?? 'Delete failed'),
            );
          }
        }),

      /**
       * Get the current authenticated user.
       * Requires authentication.
       *
       * @param headers - Optional request headers for authentication
       * @returns Current user or fails with Unauthenticated
       */
      getCurrentUser: (headers?: Headers): Effect.Effect<User, AuthError | Unauthenticated> =>
        Effect.gen(function* () {
          const session = yield* auth.getSession.pipe(Effect.mapError(() => new Unauthenticated()));

          return yield* Schema.decodeUnknown(User)(session.user).pipe(
            Effect.mapError((e) => new AuthError({ message: `Parse error: ${e.message}` })),
          );
        }),
    };
  }),
  dependencies: [AuthService.Default],
}) {}
