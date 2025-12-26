import { Atom } from "@effect-atom/atom-react";
import * as Effect from "effect/Effect";
import { authClient } from "../auth.client.js";

/**
 * AdminApi - Effect Service wrapper around Better Auth admin client
 *
 * Wraps Better Auth's admin plugin methods in Effect for:
 * - Type-safe error handling
 * - Integration with effect-atom state management
 * - Composable admin operations
 */
class AdminApi extends Effect.Service<AdminApi>()("@features/auth/AdminApi", {
  effect: Effect.sync(() => ({
    // ===== USER MANAGEMENT =====

    createUser: (input: any) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.admin.createUser(input);
          if (result.error) {
            throw new Error(result.error.message || "Failed to create user");
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `Failed to create user: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

		listUsers: (input?: any) =>
			Effect.tryPromise({
				try: async () => {
					const result = await authClient.admin.listUsers({ query: input || {} } as any);
					if (result.error) {
						throw new Error(result.error.message || "Failed to list users");
					}
					return result.data;
				},
				catch: (error) =>
					new Error(
						`Failed to list users: ${error instanceof Error ? error.message : String(error)}`,
					),
			}),

    updateUser: (input: any) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.admin.updateUser(input);
          if (result.error) {
            throw new Error(result.error.message || "Failed to update user");
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `Failed to update user: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

    removeUser: (userId: string) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.admin.removeUser({ userId });
          if (result.error) {
            throw new Error(result.error.message || "Failed to remove user");
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `Failed to remove user: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

    // ===== ROLE MANAGEMENT =====

    setRole: (input: any) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.admin.setRole(input as any);
          if (result.error) {
            throw new Error(result.error.message || "Failed to set role");
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `Failed to set role: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

    // ===== BAN MANAGEMENT =====

    banUser: (input: {
      userId: string;
      banReason?: string;
      banExpiresIn?: number;
    }) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.admin.banUser(input);
          if (result.error) {
            throw new Error(result.error.message || "Failed to ban user");
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `Failed to ban user: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

    unbanUser: (userId: string) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.admin.unbanUser({ userId });
          if (result.error) {
            throw new Error(result.error.message || "Failed to unban user");
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `Failed to unban user: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

    // ===== SESSION MANAGEMENT =====

    listUserSessions: (userId: string) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.admin.listUserSessions({ userId });
          if (result.error) {
            throw new Error(
              result.error.message || "Failed to list user sessions",
            );
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `Failed to list user sessions: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

    revokeUserSession: (sessionToken: string) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.admin.revokeUserSession({
            sessionToken,
          });
          if (result.error) {
            throw new Error(result.error.message || "Failed to revoke session");
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `Failed to revoke session: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

    revokeUserSessions: (userId: string) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.admin.revokeUserSessions({ userId });
          if (result.error) {
            throw new Error(
              result.error.message || "Failed to revoke user sessions",
            );
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `Failed to revoke user sessions: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

    setUserPassword: (input: { userId: string; newPassword: string }) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.admin.setUserPassword(input);
          if (result.error) {
            throw new Error(result.error.message || "Failed to set password");
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `Failed to set password: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

    // ===== IMPERSONATION =====

    impersonateUser: (userId: string) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.admin.impersonateUser({ userId });
          if (result.error) {
            throw new Error(
              result.error.message || "Failed to impersonate user",
            );
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `Failed to impersonate user: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

    stopImpersonating: () =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.admin.stopImpersonating();
          if (result.error) {
            throw new Error(
              result.error.message || "Failed to stop impersonating",
            );
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `Failed to stop impersonating: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

    // ===== PERMISSIONS =====

    hasPermission: (input: any) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.admin.hasPermission(input as any);
          if (result.error) {
            throw new Error(
              result.error.message || "Failed to check permission",
            );
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `Failed to check permission: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

    // ===== ADMIN DATA FETCHING =====

    listAllOrganizations: () =>
      Effect.tryPromise({
        try: async () => {
          const response = await fetch("/api/admin/organizations");
          if (!response.ok) throw new Error("Failed to fetch organizations");
          const data = await response.json();
          return data.organizations || [];
        },
        catch: (error) =>
          new Error(
            `Failed to list organizations: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

    listAllSessions: () =>
      Effect.tryPromise({
        try: async () => {
          const response = await fetch("/api/admin/sessions");
          if (!response.ok) throw new Error("Failed to fetch sessions");
          const data = await response.json();
          return data.sessions || [];
        },
        catch: (error) =>
          new Error(
            `Failed to list sessions: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

    listAllInvitations: () =>
      Effect.tryPromise({
        try: async () => {
          const response = await fetch("/api/admin/invitations");
          if (!response.ok) throw new Error("Failed to fetch invitations");
          const data = await response.json();
          return data.invitations || [];
        },
        catch: (error) =>
          new Error(
            `Failed to list invitations: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

    listAllMembers: () =>
      Effect.tryPromise({
        try: async () => {
          const response = await fetch("/api/admin/members");
          if (!response.ok) throw new Error("Failed to fetch members");
          const data = await response.json();
          return data.members || [];
        },
        catch: (error) =>
          new Error(
            `Failed to list members: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),
  })),
}) {}

/**
 * Runtime for admin atoms - provides AdminApi service
 */
export const adminRuntime = Atom.runtime(AdminApi.Default);

// ===== USER MANAGEMENT ATOMS =====

/**
 * createUserAtom - Create a new user (admin operation)
 */
export const createUserAtom = adminRuntime.fn<{
  email: string;
  password: string;
  name: string;
  role?: string | string[];
  data?: Record<string, any>;
}>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* AdminApi;
    return yield* api.createUser(input);
  }),
);

/**
 * listUsersAtom - List all users with filtering and pagination
 */
export const listUsersAtom = adminRuntime.atom(
  Effect.gen(function* () {
    const api = yield* AdminApi;
    return yield* api.listUsers();
  }),
);

/**
 * updateUserAtom - Update user details (admin operation)
 */
export const updateUserAtom = adminRuntime.fn<{
  userId: string;
  data: Record<string, any>;
}>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* AdminApi;
    return yield* api.updateUser(input);
  }),
);

/**
 * removeUserAtom - Delete a user (admin operation)
 */
export const removeUserAtom = adminRuntime.fn<{ userId: string }>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* AdminApi;
    return yield* api.removeUser(input.userId);
  }),
);

// ===== ROLE MANAGEMENT ATOMS =====

/**
 * setRoleAtom - Set user role(s)
 */
export const setRoleAtom = adminRuntime.fn<{
  userId?: string;
  role: string | string[];
}>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* AdminApi;
    return yield* api.setRole(input);
  }),
);

// ===== BAN MANAGEMENT ATOMS =====

/**
 * banUserAtom - Ban a user
 */
export const banUserAtom = adminRuntime.fn<{
  userId: string;
  banReason?: string;
  banExpiresIn?: number;
}>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* AdminApi;
    return yield* api.banUser(input);
  }),
);

/**
 * unbanUserAtom - Unban a user
 */
export const unbanUserAtom = adminRuntime.fn<{ userId: string }>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* AdminApi;
    return yield* api.unbanUser(input.userId);
  }),
);

// ===== SESSION MANAGEMENT ATOMS =====

/**
 * listUserSessionsAtom - List all sessions for a user
 */
export const listUserSessionsAtom = adminRuntime.fn<{ userId: string }>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* AdminApi;
    return yield* api.listUserSessions(input.userId);
  }),
);

/**
 * revokeUserSessionAtom - Revoke a specific session
 */
export const revokeUserSessionAtom = adminRuntime.fn<{
  sessionToken: string;
}>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* AdminApi;
    return yield* api.revokeUserSession(input.sessionToken);
  }),
);

/**
 * revokeUserSessionsAtom - Revoke all sessions for a user
 */
export const revokeUserSessionsAtom = adminRuntime.fn<{ userId: string }>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* AdminApi;
    return yield* api.revokeUserSessions(input.userId);
  }),
);

/**
 * setUserPasswordAtom - Set user password (admin operation)
 */
export const setUserPasswordAtom = adminRuntime.fn<{
  userId: string;
  newPassword: string;
}>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* AdminApi;
    return yield* api.setUserPassword(input);
  }),
);

// ===== IMPERSONATION ATOMS =====

/**
 * impersonateUserAtom - Impersonate a user (creates session as that user)
 */
export const impersonateUserAtom = adminRuntime.fn<{ userId: string }>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* AdminApi;
    return yield* api.impersonateUser(input.userId);
  }),
);

/**
 * stopImpersonatingAtom - Stop impersonating and return to admin session
 */
export const stopImpersonatingAtom = adminRuntime.fn<void>()(
  Effect.fnUntraced(function* () {
    const api = yield* AdminApi;
    return yield* api.stopImpersonating();
  }),
);

// ===== PERMISSION ATOMS =====

/**
 * hasPermissionAtom - Check if user has specific permissions
 */
export const hasPermissionAtom = adminRuntime.fn<{
  userId?: string;
  role?: string;
  permission?: Record<string, string[]>;
}>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* AdminApi;
    return yield* api.hasPermission(input);
  }),
);
