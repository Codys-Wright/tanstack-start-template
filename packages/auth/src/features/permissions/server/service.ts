/**
 * Permission Service
 *
 * Provides Effect-wrapped permission checking for server-side code.
 * Uses Better Auth's hasPermission API for checking user and organization permissions.
 */

import * as Effect from 'effect/Effect';
import * as Data from 'effect/Data';
import { AuthService } from '@auth/core/server/service';

// =============================================================================
// Errors
// =============================================================================

/**
 * Error thrown when a user doesn't have the required permission.
 */
export class PermissionDenied extends Data.TaggedError('PermissionDenied')<{
  readonly resource: string;
  readonly action: string;
  readonly message?: string;
}> {}

/**
 * Error thrown when permission check fails unexpectedly.
 */
export class PermissionCheckFailed extends Data.TaggedError('PermissionCheckFailed')<{
  readonly cause: unknown;
}> {}

// =============================================================================
// Types
// =============================================================================

export type PermissionMap = Record<string, string[]>;

export interface CheckPermissionInput {
  /** The permissions to check. E.g., { announcement: ["create", "read"] } */
  permissions: PermissionMap;
  /** Optional user ID. If not provided, uses current session user. */
  userId?: string;
}

export interface CheckOrgPermissionInput {
  /** The permissions to check. E.g., { announcement: ["create", "read"] } */
  permissions: PermissionMap;
  /** Optional organization ID. If not provided, uses active organization. */
  organizationId?: string;
}

// =============================================================================
// Permission Service
// =============================================================================

/**
 * Permission Service for checking user and organization permissions.
 *
 * @example
 * ```ts
 * const permissionService = yield* PermissionService;
 *
 * // Check if current user can create announcements
 * const canCreate = yield* permissionService.hasPermission({
 *   permissions: { announcement: ["create"] },
 * });
 *
 * // Require permission (throws PermissionDenied if not allowed)
 * yield* permissionService.requirePermission({
 *   permissions: { announcement: ["create"] },
 * });
 *
 * // Check organization permission
 * const canPublish = yield* permissionService.hasOrgPermission({
 *   permissions: { announcement: ["publish"] },
 * });
 * ```
 */
export class PermissionService extends Effect.Service<PermissionService>()('PermissionService', {
  dependencies: [AuthService.Default],
  effect: Effect.gen(function* () {
    const auth = yield* AuthService;
    const api = auth.api as any;

    return {
      /**
       * Check if the current user has the specified admin permissions.
       * Returns true/false without throwing.
       */
      hasPermission: (input: CheckPermissionInput): Effect.Effect<boolean, PermissionCheckFailed> =>
        Effect.tryPromise({
          try: async () => {
            const result = await api.userHasPermission({
              body: {
                userId: input.userId,
                permissions: input.permissions,
              },
            });
            return result?.hasPermission ?? false;
          },
          catch: (error) => new PermissionCheckFailed({ cause: error }),
        }),

      /**
       * Require the current user to have the specified admin permissions.
       * Throws PermissionDenied if the user doesn't have the permission.
       */
      requirePermission: (
        input: CheckPermissionInput,
      ): Effect.Effect<void, PermissionDenied | PermissionCheckFailed> =>
        Effect.gen(function* () {
          const hasPermission = yield* Effect.tryPromise({
            try: async () => {
              const result = await api.userHasPermission({
                body: {
                  userId: input.userId,
                  permissions: input.permissions,
                },
              });
              return result?.hasPermission ?? false;
            },
            catch: (error) => new PermissionCheckFailed({ cause: error }),
          });

          if (!hasPermission) {
            const [resource, actions] = Object.entries(input.permissions)[0] ?? [
              'unknown',
              ['unknown'],
            ];
            return yield* Effect.fail(
              new PermissionDenied({
                resource,
                action: actions.join(', '),
                message: `Permission denied: ${resource}:${actions.join(', ')}`,
              }),
            );
          }
        }),

      /**
       * Check if the current user has the specified organization permissions.
       * Returns true/false without throwing.
       */
      hasOrgPermission: (
        input: CheckOrgPermissionInput,
      ): Effect.Effect<boolean, PermissionCheckFailed> =>
        Effect.tryPromise({
          try: async () => {
            const result = await api.hasOrganizationPermission({
              body: {
                organizationId: input.organizationId,
                permissions: input.permissions,
              },
            });
            return result?.hasPermission ?? false;
          },
          catch: (error) => new PermissionCheckFailed({ cause: error }),
        }),

      /**
       * Require the current user to have the specified organization permissions.
       * Throws PermissionDenied if the user doesn't have the permission.
       */
      requireOrgPermission: (
        input: CheckOrgPermissionInput,
      ): Effect.Effect<void, PermissionDenied | PermissionCheckFailed> =>
        Effect.gen(function* () {
          const hasPermission = yield* Effect.tryPromise({
            try: async () => {
              const result = await api.hasOrganizationPermission({
                body: {
                  organizationId: input.organizationId,
                  permissions: input.permissions,
                },
              });
              return result?.hasPermission ?? false;
            },
            catch: (error) => new PermissionCheckFailed({ cause: error }),
          });

          if (!hasPermission) {
            const [resource, actions] = Object.entries(input.permissions)[0] ?? [
              'unknown',
              ['unknown'],
            ];
            return yield* Effect.fail(
              new PermissionDenied({
                resource,
                action: actions.join(', '),
                message: `Organization permission denied: ${resource}:${actions.join(', ')}`,
              }),
            );
          }
        }),

      /**
       * Check multiple permissions at once.
       * Returns an object with the result for each permission.
       */
      checkPermissions: <T extends PermissionMap>(
        permissions: T,
      ): Effect.Effect<Record<keyof T, boolean>, PermissionCheckFailed> =>
        Effect.gen(function* () {
          const results: Record<string, boolean> = {};

          for (const [resource, actions] of Object.entries(permissions)) {
            const hasPermission = yield* Effect.tryPromise({
              try: async () => {
                const result = await api.userHasPermission({
                  body: {
                    permissions: { [resource]: actions },
                  },
                });
                return result?.hasPermission ?? false;
              },
              catch: (error) => new PermissionCheckFailed({ cause: error }),
            });
            results[resource] = hasPermission;
          }

          return results as Record<keyof T, boolean>;
        }),
    };
  }),
}) {}
