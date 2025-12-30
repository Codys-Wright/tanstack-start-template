import * as HttpApiBuilder from '@effect/platform/HttpApiBuilder';
import * as HttpApiGroup from '@effect/platform/HttpApiGroup';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { AuthApi } from '../../../../core/auth-api';
import { AdminService } from './service';
import { AuthError } from '../../../../features/session/domain/schema';
import {
  AdminUpdateUserInput,
  BanUserInput,
  CreateUserInput,
  HasPermissionInput,
  OrganizationWithMemberCount,
  SessionWithUser,
  SetRoleInput,
  SetUserPasswordInput,
} from '../domain/schema';

/**
 * AdminApiLive - HTTP API handlers for admin group.
 *
 * Uses Better Auth admin plugin methods via AdminService.
 */
export const AdminApiLive = HttpApiBuilder.group(AuthApi, 'admin', (handlers) =>
  handlers
    .handle('listOrganizations', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Admin API] Listing organizations');
        const admin = yield* AdminService;
        return yield* admin.listOrganizations();
      }),
    )
    .handle('listSessions', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Admin API] Listing sessions');
        const admin = yield* AdminService;
        return yield* admin.listSessions();
      }),
    )
    .handle('listMembers', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Admin API] Listing members');
        const admin = yield* AdminService;
        return yield* admin.listMembers();
      }),
    )
    .handle('createUser', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Admin API] Creating user');
        const admin = yield* AdminService;
        return yield* admin.createUser(payload);
      }),
    )
    .handle('updateUser', ({ path, payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Admin API] Updating user', path.userId);
        const admin = yield* AdminService;
        return yield* admin.updateUser(payload);
      }),
    )
    .handle('setRole', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Admin API] Setting user role', payload);
        const admin = yield* AdminService;
        return yield* admin.setRole(payload);
      }),
    )
    .handle('banUser', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Admin API] Banning user', payload);
        const admin = yield* AdminService;
        return yield* admin.banUser(payload);
      }),
    )
    .handle('setUserPassword', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Admin API] Setting user password', payload.userId);
        const admin = yield* AdminService;
        return yield* admin.setUserPassword(payload);
      }),
    )
    .handle('hasPermission', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Admin API] Checking permission', payload);
        const admin = yield* AdminService;
        return yield* admin.hasPermission(payload);
      }),
    ),
).pipe(Layer.provide(AdminService.Default));
