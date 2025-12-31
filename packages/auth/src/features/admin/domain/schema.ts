import * as Schema from 'effect/Schema';
import { User } from '@auth/features/user/domain/schema';
import { Session } from '@auth/features/session/domain/schema';

/**
 * Admin Domain Schemas
 * Matches Better Auth Admin Plugin OpenAPI spec
 */

// Re-export User for convenience
export { User };

// ============================================================================
// Input Schemas
// ============================================================================

/**
 * Input for POST /admin/create-user
 */
export const CreateUserInput = Schema.Struct({
  email: Schema.String,
  password: Schema.String,
  name: Schema.String,
  role: Schema.optional(Schema.Union(Schema.String, Schema.Array(Schema.String))),
  data: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
});
export type CreateUserInput = typeof CreateUserInput.Type;

/**
 * Input for GET /admin/get-user (query params)
 */
export const GetUserInput = Schema.Struct({
  userId: Schema.String,
});
export type GetUserInput = typeof GetUserInput.Type;

/**
 * Input for POST /admin/update-user
 */
export const AdminUpdateUserInput = Schema.Struct({
  userId: Schema.String,
  name: Schema.optional(Schema.String),
  email: Schema.optional(Schema.String),
  image: Schema.optional(Schema.NullOr(Schema.String)),
  role: Schema.optional(Schema.Union(Schema.String, Schema.Array(Schema.String))),
  banned: Schema.optional(Schema.Boolean),
  banReason: Schema.optional(Schema.NullOr(Schema.String)),
  banExpires: Schema.optional(Schema.NullOr(Schema.Number)),
  data: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
});
export type AdminUpdateUserInput = typeof AdminUpdateUserInput.Type;

/**
 * Input for POST /admin/set-role
 */
export const SetRoleInput = Schema.Struct({
  userId: Schema.String,
  role: Schema.Union(Schema.String, Schema.Array(Schema.String)),
});
export type SetRoleInput = typeof SetRoleInput.Type;

/**
 * Input for POST /admin/ban-user
 */
export const BanUserInput = Schema.Struct({
  userId: Schema.String,
  banReason: Schema.optional(Schema.String),
  banExpiresIn: Schema.optional(Schema.Number),
});
export type BanUserInput = typeof BanUserInput.Type;

/**
 * Input for POST /admin/unban-user
 */
export const UnbanUserInput = Schema.Struct({
  userId: Schema.String,
});
export type UnbanUserInput = typeof UnbanUserInput.Type;

/**
 * Input for POST /admin/remove-user
 */
export const RemoveUserInput = Schema.Struct({
  userId: Schema.String,
});
export type RemoveUserInput = typeof RemoveUserInput.Type;

/**
 * Input for POST /admin/set-user-password
 */
export const SetUserPasswordInput = Schema.Struct({
  userId: Schema.String,
  newPassword: Schema.String,
});
export type SetUserPasswordInput = typeof SetUserPasswordInput.Type;

/**
 * Input for POST /admin/has-permission
 */
export const HasPermissionInput = Schema.Struct({
  userId: Schema.optional(Schema.String),
  role: Schema.optional(Schema.String),
  permission: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.Array(Schema.String) }),
  ),
});
export type HasPermissionInput = typeof HasPermissionInput.Type;

/**
 * Input for POST /admin/impersonate-user
 */
export const ImpersonateUserInput = Schema.Struct({
  userId: Schema.String,
});
export type ImpersonateUserInput = typeof ImpersonateUserInput.Type;

/**
 * Input for GET /admin/list-users (query params)
 * Note: Uses NumberFromString for URL params since they come as strings
 */
export const ListUsersInput = Schema.Struct({
  limit: Schema.optional(Schema.NumberFromString),
  offset: Schema.optional(Schema.NumberFromString),
  searchValue: Schema.optional(Schema.String),
  searchField: Schema.optional(Schema.String),
  filterField: Schema.optional(Schema.String),
  filterValue: Schema.optional(Schema.String),
  sortBy: Schema.optional(Schema.String),
  sortDirection: Schema.optional(Schema.Literal('asc', 'desc')),
});
export type ListUsersInput = typeof ListUsersInput.Type;

/**
 * Input for GET /admin/list-user-sessions (query params)
 */
export const ListUserSessionsInput = Schema.Struct({
  userId: Schema.String,
});
export type ListUserSessionsInput = typeof ListUserSessionsInput.Type;

/**
 * Input for POST /admin/revoke-user-session
 */
export const RevokeUserSessionInput = Schema.Struct({
  sessionToken: Schema.String,
});
export type RevokeUserSessionInput = typeof RevokeUserSessionInput.Type;

/**
 * Input for POST /admin/revoke-user-sessions
 */
export const RevokeUserSessionsInput = Schema.Struct({
  userId: Schema.String,
});
export type RevokeUserSessionsInput = typeof RevokeUserSessionsInput.Type;

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * Response from POST /admin/create-user
 */
export const CreateUserResponse = Schema.Struct({
  user: User,
});
export type CreateUserResponse = typeof CreateUserResponse.Type;

/**
 * Response from GET /admin/list-users
 */
export const ListUsersResponse = Schema.Struct({
  users: Schema.Array(User),
  total: Schema.optional(Schema.Number),
});
export type ListUsersResponse = typeof ListUsersResponse.Type;

/**
 * Response from GET /admin/list-user-sessions
 */
export const ListUserSessionsResponse = Schema.Struct({
  sessions: Schema.Array(Session),
});
export type ListUserSessionsResponse = typeof ListUserSessionsResponse.Type;

/**
 * Response from POST /admin/impersonate-user
 */
export const ImpersonateUserResponse = Schema.Struct({
  session: Session,
  user: User,
});
export type ImpersonateUserResponse = typeof ImpersonateUserResponse.Type;

/**
 * Standard success response
 */
export const AdminSuccessResponse = Schema.Struct({
  success: Schema.Boolean,
});
export type AdminSuccessResponse = typeof AdminSuccessResponse.Type;

/**
 * Response from POST /admin/has-permission
 */
export const HasPermissionResponse = Schema.Struct({
  hasPermission: Schema.Boolean,
});
export type HasPermissionResponse = typeof HasPermissionResponse.Type;
