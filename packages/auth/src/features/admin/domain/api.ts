import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint';
import * as HttpApiGroup from '@effect/platform/HttpApiGroup';
import * as Schema from 'effect/Schema';
import { AuthError } from '@auth/features/session/domain/schema';
import { User } from '@auth/features/user/domain/schema';

// Import schemas from the canonical source
import {
  CreateUserInput,
  CreateUserResponse,
  GetUserInput,
  AdminUpdateUserInput,
  SetRoleInput,
  BanUserInput,
  UnbanUserInput,
  RemoveUserInput,
  SetUserPasswordInput,
  HasPermissionInput,
  HasPermissionResponse,
  ImpersonateUserInput,
  ImpersonateUserResponse,
  ListUsersInput,
  ListUsersResponse,
  ListUserSessionsInput,
  ListUserSessionsResponse,
  RevokeUserSessionInput,
  RevokeUserSessionsInput,
  AdminSuccessResponse,
} from './schema.js';

/**
 * AdminApiGroup - HTTP API group for admin operations.
 * Matches Better Auth Admin Plugin OpenAPI spec.
 *
 * This is composed into AuthApi.
 *
 * Endpoints (matching Better Auth):
 * - GET /admin/list-users - List all users with pagination/filtering
 * - GET /admin/get-user - Get user by ID
 * - POST /admin/create-user - Create a new user
 * - POST /admin/update-user - Update user data
 * - POST /admin/set-role - Set user role(s)
 * - POST /admin/ban-user - Ban a user
 * - POST /admin/unban-user - Unban a user
 * - POST /admin/remove-user - Delete a user
 * - POST /admin/set-user-password - Set user password
 * - POST /admin/has-permission - Check if user has permission
 * - POST /admin/impersonate-user - Impersonate a user
 * - POST /admin/stop-impersonating - Stop impersonating
 * - GET /admin/list-user-sessions - List sessions for a user
 * - POST /admin/revoke-user-session - Revoke a specific session
 * - POST /admin/revoke-user-sessions - Revoke all sessions for a user
 */
export class AdminApiGroup extends HttpApiGroup.make('admin')
  // User management
  .add(
    HttpApiEndpoint.get('listUsers', '/list-users')
      .setUrlParams(ListUsersInput)
      .addSuccess(ListUsersResponse)
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.get('getUser', '/get-user')
      .setUrlParams(GetUserInput)
      .addSuccess(Schema.Struct({ user: User }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('createUser', '/create-user')
      .setPayload(CreateUserInput)
      .addSuccess(CreateUserResponse)
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('updateUser', '/update-user')
      .setPayload(AdminUpdateUserInput)
      .addSuccess(Schema.Struct({ user: User }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('setRole', '/set-role')
      .setPayload(SetRoleInput)
      .addSuccess(AdminSuccessResponse)
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('banUser', '/ban-user')
      .setPayload(BanUserInput)
      .addSuccess(Schema.Struct({ user: User }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('unbanUser', '/unban-user')
      .setPayload(UnbanUserInput)
      .addSuccess(Schema.Struct({ user: User }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('removeUser', '/remove-user')
      .setPayload(RemoveUserInput)
      .addSuccess(AdminSuccessResponse)
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('setUserPassword', '/set-user-password')
      .setPayload(SetUserPasswordInput)
      .addSuccess(AdminSuccessResponse)
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('hasPermission', '/has-permission')
      .setPayload(HasPermissionInput)
      .addSuccess(HasPermissionResponse)
      .addError(AuthError),
  )
  // Impersonation
  .add(
    HttpApiEndpoint.post('impersonateUser', '/impersonate-user')
      .setPayload(ImpersonateUserInput)
      .addSuccess(ImpersonateUserResponse)
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('stopImpersonating', '/stop-impersonating')
      .addSuccess(AdminSuccessResponse)
      .addError(AuthError),
  )
  // Session management
  .add(
    HttpApiEndpoint.get('listUserSessions', '/list-user-sessions')
      .setUrlParams(ListUserSessionsInput)
      .addSuccess(ListUserSessionsResponse)
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('revokeUserSession', '/revoke-user-session')
      .setPayload(RevokeUserSessionInput)
      .addSuccess(AdminSuccessResponse)
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('revokeUserSessions', '/revoke-user-sessions')
      .setPayload(RevokeUserSessionsInput)
      .addSuccess(AdminSuccessResponse)
      .addError(AuthError),
  )
  .prefix('/admin') {}
