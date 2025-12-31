import * as Effect from 'effect/Effect';
import { AuthService } from '@auth/core/server/service';

/**
 * Admin Service - Wraps Better Auth admin operations in Effect
 *
 * Uses auth.api.* methods for admin operations.
 * The admin plugin exposes methods like:
 * - listUsers, createUser, banUser, unbanUser, removeUser
 * - setRole, impersonateUser, stopImpersonating
 * - revokeUserSessions, revokeSessions
 *
 * Note: We use type assertion (as any) because Better Auth's TypeScript types
 * don't fully expose plugin-added methods, but they exist at runtime.
 */
export class AdminService extends Effect.Service<AdminService>()('AdminService', {
  dependencies: [AuthService.Default],
  effect: Effect.gen(function* () {
    const auth = yield* AuthService;
    // Type assertion needed because Better Auth types don't fully expose plugin methods
    const api = auth.api as any;

    return {
      /**
       * List all users with optional filters
       */
      listUsers: (input?: {
        limit?: number;
        offset?: number;
        searchValue?: string;
        searchField?: string;
        filterField?: string;
        filterValue?: string;
        sortBy?: string;
        sortDirection?: 'asc' | 'desc';
      }) =>
        Effect.tryPromise({
          try: () => api.listUsers({ query: input ?? {} }),
          catch: (error) => new Error(`Failed to list users: ${error}`),
        }),

      /**
       * Get a specific user by ID
       */
      getUser: (input: { userId: string }) =>
        Effect.tryPromise({
          try: () => api.getUser({ query: input }),
          catch: (error) => new Error(`Failed to get user: ${error}`),
        }),

      /**
       * Create a new user
       */
      createUser: (input: {
        email: string;
        password: string;
        name: string;
        role?: string | string[];
        data?: Record<string, unknown>;
      }) =>
        Effect.tryPromise({
          try: () => api.createUser({ body: input }),
          catch: (error) => new Error(`Failed to create user: ${error}`),
        }),

      /**
       * Update a user (admin)
       */
      updateUser: (input: {
        userId: string;
        name?: string;
        email?: string;
        image?: string | null;
        role?: string | string[];
        banned?: boolean;
        banReason?: string | null;
        banExpires?: number | null;
        data?: Record<string, unknown>;
      }) =>
        Effect.tryPromise({
          try: () => api.updateUser({ body: input }),
          catch: (error) => new Error(`Failed to update user: ${error}`),
        }),

      /**
       * Set user role(s)
       */
      setRole: (input: { userId: string; role: string | string[] }) =>
        Effect.tryPromise({
          try: () => api.setRole({ body: input }),
          catch: (error) => new Error(`Failed to set role: ${error}`),
        }),

      /**
       * Ban a user
       */
      banUser: (input: { userId: string; banReason?: string; banExpiresIn?: number }) =>
        Effect.tryPromise({
          try: () => api.banUser({ body: input }),
          catch: (error) => new Error(`Failed to ban user: ${error}`),
        }),

      /**
       * Unban a user
       */
      unbanUser: (input: { userId: string }) =>
        Effect.tryPromise({
          try: () => api.unbanUser({ body: input }),
          catch: (error) => new Error(`Failed to unban user: ${error}`),
        }),

      /**
       * Remove a user
       */
      removeUser: (input: { userId: string }) =>
        Effect.tryPromise({
          try: () => api.removeUser({ body: input }),
          catch: (error) => new Error(`Failed to remove user: ${error}`),
        }),

      /**
       * Set user password (admin)
       */
      setUserPassword: (input: { userId: string; newPassword: string }) =>
        Effect.tryPromise({
          try: () => api.setUserPassword({ body: input }),
          catch: (error) => new Error(`Failed to set user password: ${error}`),
        }),

      /**
       * Check if a user has permission
       */
      hasPermission: (input: {
        userId?: string;
        role?: string;
        permission?: Record<string, string[]>;
      }) =>
        Effect.tryPromise({
          try: () => api.hasPermission({ body: input }),
          catch: (error) => new Error(`Failed to check permission: ${error}`),
        }),

      /**
       * Impersonate a user (admin only)
       */
      impersonateUser: (input: { userId: string }) =>
        Effect.tryPromise({
          try: () => api.impersonateUser({ body: input }),
          catch: (error) => new Error(`Failed to impersonate user: ${error}`),
        }),

      /**
       * Stop impersonating a user
       */
      stopImpersonating: () =>
        Effect.tryPromise({
          try: () => api.stopImpersonating({ body: {} }),
          catch: (error) => new Error(`Failed to stop impersonating: ${error}`),
        }),

      /**
       * List sessions for a user
       */
      listUserSessions: (input: { userId: string }) =>
        Effect.tryPromise({
          try: () => api.listUserSessions({ query: input }),
          catch: (error) => new Error(`Failed to list user sessions: ${error}`),
        }),

      /**
       * Revoke a specific session by token
       */
      revokeUserSession: (input: { sessionToken: string }) =>
        Effect.tryPromise({
          try: () => api.revokeUserSession({ body: input }),
          catch: (error) => new Error(`Failed to revoke user session: ${error}`),
        }),

      /**
       * Revoke all sessions for a user
       */
      revokeUserSessions: (input: { userId: string }) =>
        Effect.tryPromise({
          try: () => api.revokeUserSessions({ body: input }),
          catch: (error) => new Error(`Failed to revoke user sessions: ${error}`),
        }),
    };
  }),
}) {}
