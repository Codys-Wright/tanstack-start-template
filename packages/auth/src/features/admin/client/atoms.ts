import { Atom } from '@effect-atom/atom-react';
import * as Effect from 'effect/Effect';
import { AdminApi } from './client';

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
