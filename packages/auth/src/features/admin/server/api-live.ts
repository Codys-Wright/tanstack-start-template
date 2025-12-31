import * as HttpApiBuilder from '@effect/platform/HttpApiBuilder';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { AuthApi } from '@auth/core/auth-api';
import { AdminService } from '@auth/features/admin/server/service';
import { AuthError } from '@auth/features/session/domain/schema';
import type { User } from '@auth/features/user/domain/schema';
import type { Session } from '@auth/features/session/domain/schema';

/**
 * AdminApiLive - HTTP API handlers for admin group.
 *
 * Implements all 15 Better Auth admin plugin endpoints:
 * - listUsers, getUser, createUser, updateUser, setRole
 * - banUser, unbanUser, removeUser, setUserPassword
 * - hasPermission, impersonateUser, stopImpersonating
 * - listUserSessions, revokeUserSession, revokeUserSessions
 *
 * Note: We use type assertions because Better Auth's runtime response types
 * are not fully typed, but the data matches our schemas at runtime.
 */
export const AdminApiLive = HttpApiBuilder.group(AuthApi, 'admin', (handlers) =>
  handlers
    // User management
    .handle('listUsers', ({ urlParams }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Admin API] Listing users', urlParams);
        const admin = yield* AdminService;
        const result = yield* admin.listUsers(urlParams);
        // Better Auth returns { users: User[], total?: number }
        return result as { users: readonly User[]; total?: number };
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    .handle('getUser', ({ urlParams }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Admin API] Getting user', urlParams.userId);
        const admin = yield* AdminService;
        const result = yield* admin.getUser({ userId: urlParams.userId });
        // Better Auth returns the user directly
        return { user: result as User };
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    .handle('createUser', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Admin API] Creating user', payload.email);
        const admin = yield* AdminService;
        const result = yield* admin.createUser({
          email: payload.email,
          password: payload.password,
          name: payload.name,
          role: payload.role as string | string[] | undefined,
          data: payload.data as Record<string, unknown> | undefined,
        });
        // Better Auth returns { user: User }
        return { user: result as User };
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    .handle('updateUser', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Admin API] Updating user', payload.userId);
        const admin = yield* AdminService;
        const result = yield* admin.updateUser({
          userId: payload.userId,
          name: payload.name,
          email: payload.email,
          image: payload.image,
          role: payload.role as string | string[] | undefined,
          banned: payload.banned,
          banReason: payload.banReason,
          banExpires: payload.banExpires,
          data: payload.data as Record<string, unknown> | undefined,
        });
        // Better Auth returns { user: User }
        return { user: result as User };
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    .handle('setRole', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Admin API] Setting user role', payload.userId);
        const admin = yield* AdminService;
        yield* admin.setRole({
          userId: payload.userId,
          role: payload.role as string | string[],
        });
        return { success: true as const };
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    .handle('banUser', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Admin API] Banning user', payload.userId);
        const admin = yield* AdminService;
        const result = yield* admin.banUser({
          userId: payload.userId,
          banReason: payload.banReason,
          banExpiresIn: payload.banExpiresIn,
        });
        // Better Auth returns { user: User }
        return { user: result as User };
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    .handle('unbanUser', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Admin API] Unbanning user', payload.userId);
        const admin = yield* AdminService;
        const result = yield* admin.unbanUser({ userId: payload.userId });
        // Better Auth returns { user: User }
        return { user: result as User };
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    .handle('removeUser', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Admin API] Removing user', payload.userId);
        const admin = yield* AdminService;
        yield* admin.removeUser({ userId: payload.userId });
        return { success: true as const };
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    .handle('setUserPassword', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Admin API] Setting user password', payload.userId);
        const admin = yield* AdminService;
        yield* admin.setUserPassword({
          userId: payload.userId,
          newPassword: payload.newPassword,
        });
        return { success: true as const };
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    .handle('hasPermission', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Admin API] Checking permission');
        const admin = yield* AdminService;
        const result = yield* admin.hasPermission({
          userId: payload.userId,
          role: payload.role,
          permission: payload.permission as Record<string, string[]> | undefined,
        });
        // Better Auth returns { hasPermission: boolean } or similar
        const hasPermissionValue =
          typeof result === 'object' && result !== null && 'hasPermission' in result
            ? Boolean((result as { hasPermission: unknown }).hasPermission)
            : Boolean(result);
        return { hasPermission: hasPermissionValue };
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    // Impersonation
    .handle('impersonateUser', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Admin API] Impersonating user', payload.userId);
        const admin = yield* AdminService;
        const result = yield* admin.impersonateUser({ userId: payload.userId });
        // Better Auth returns { session: Session, user: User }
        return result as { session: Session; user: User };
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    .handle('stopImpersonating', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Admin API] Stopping impersonation');
        const admin = yield* AdminService;
        yield* admin.stopImpersonating();
        return { success: true as const };
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    // Session management
    .handle('listUserSessions', ({ urlParams }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Admin API] Listing user sessions', urlParams.userId);
        const admin = yield* AdminService;
        const result = yield* admin.listUserSessions({
          userId: urlParams.userId,
        });
        // Better Auth returns { sessions: Session[] }
        return result as { sessions: readonly Session[] };
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    .handle('revokeUserSession', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Admin API] Revoking session', payload.sessionToken);
        const admin = yield* AdminService;
        yield* admin.revokeUserSession({ sessionToken: payload.sessionToken });
        return { success: true as const };
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    .handle('revokeUserSessions', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Admin API] Revoking all sessions for user', payload.userId);
        const admin = yield* AdminService;
        yield* admin.revokeUserSessions({ userId: payload.userId });
        return { success: true as const };
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    ),
).pipe(Layer.provide(AdminService.Default));
