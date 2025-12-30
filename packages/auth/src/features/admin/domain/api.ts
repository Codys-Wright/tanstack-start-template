import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint';
import * as HttpApiGroup from '@effect/platform/HttpApiGroup';
import * as Schema from 'effect/Schema';
import { AuthError } from '../../session/domain/schema';
import { User } from '../../user/domain/schema';
import { InvitationStatus } from '../../invitation/domain/schema';
import { OrganizationRole } from '../../member/domain/schema';

/**
 * Organization with member count for admin list view
 */
export const OrganizationWithMemberCount = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  slug: Schema.String,
  logo: Schema.NullOr(Schema.String),
  metadata: Schema.optional(Schema.Unknown),
  createdAt: Schema.DateTimeUtc,
  memberCount: Schema.Number,
});
export type OrganizationWithMemberCount = typeof OrganizationWithMemberCount.Type;

/**
 * Session with user details for admin list view
 */
export const SessionWithUser = Schema.Struct({
  id: Schema.String,
  expiresAt: Schema.DateTimeUtc,
  token: Schema.String,
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
  ipAddress: Schema.optional(Schema.String),
  userAgent: Schema.optional(Schema.String),
  userId: Schema.String,
  activeOrganizationId: Schema.optional(Schema.NullOr(Schema.String)),
  activeTeamId: Schema.optional(Schema.NullOr(Schema.String)),
  impersonatedBy: Schema.optional(Schema.NullOr(Schema.String)),
  userName: Schema.String,
  userEmail: Schema.String,
});
export type SessionWithUser = typeof SessionWithUser.Type;

/**
 * Invitation with organization and inviter details for admin list view
 */
export const InvitationWithDetails = Schema.Struct({
  id: Schema.String,
  organizationId: Schema.String,
  email: Schema.String,
  role: Schema.String,
  status: InvitationStatus,
  expiresAt: Schema.DateTimeUtc,
  createdAt: Schema.DateTimeUtc,
  inviterId: Schema.optional(Schema.String),
  organizationName: Schema.String,
  teamId: Schema.optional(Schema.NullOr(Schema.String)),
  inviterName: Schema.optional(Schema.NullOr(Schema.String)),
});
export type InvitationWithDetails = typeof InvitationWithDetails.Type;

/**
 * Member with user and organization details for admin list view
 */
export const MemberWithDetails = Schema.Struct({
  id: Schema.String,
  organizationId: Schema.String,
  userId: Schema.String,
  role: OrganizationRole,
  createdAt: Schema.DateTimeUtc,
  userName: Schema.String,
  userEmail: Schema.String,
  userImage: Schema.NullOr(Schema.String),
  organizationName: Schema.String,
  organizationSlug: Schema.String,
});
export type MemberWithDetails = typeof MemberWithDetails.Type;

/**
 * Input schemas for admin operations
 */

export const CreateUserInput = Schema.Struct({
  email: Schema.String,
  password: Schema.String,
  name: Schema.String,
  role: Schema.optional(Schema.Union(Schema.String, Schema.Array(Schema.String))),
  data: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
});
export type CreateUserInput = typeof CreateUserInput.Type;

export const AdminUpdateUserInput = Schema.Struct({
  userId: Schema.String,
  data: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
});
export type AdminUpdateUserInput = typeof AdminUpdateUserInput.Type;

export const SetRoleInput = Schema.Struct({
  userId: Schema.optional(Schema.String),
  role: Schema.Union(Schema.String, Schema.Array(Schema.String)),
});
export type SetRoleInput = typeof SetRoleInput.Type;

export const BanUserInput = Schema.Struct({
  userId: Schema.String,
  banReason: Schema.optional(Schema.String),
  banExpiresIn: Schema.optional(Schema.Number),
});
export type BanUserInput = typeof BanUserInput.Type;

export const SetUserPasswordInput = Schema.Struct({
  userId: Schema.String,
  newPassword: Schema.String,
});
export type SetUserPasswordInput = typeof SetUserPasswordInput.Type;

export const HasPermissionInput = Schema.Struct({
  userId: Schema.optional(Schema.String),
  role: Schema.optional(Schema.String),
  permission: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.Array(Schema.String) }),
  ),
});
export type HasPermissionInput = typeof HasPermissionInput.Type;

/**
 * AdminApiGroup - HTTP API group for admin operations.
 * This is composed into AuthApi.
 *
 * Endpoints:
 * - GET /admin/organizations - List all organizations with member counts
 * - GET /admin/sessions - List all sessions with user details
 * - GET /admin/members - List all members with full details
 * - POST /admin/users - Create a new user
 * - PATCH /admin/users/:userId - Update user data
 * - POST /admin/users/set-role - Set user role(s)
 * - POST /admin/users/ban - Ban a user
 * - POST /admin/users/set-password - Set user password
 * - POST /admin/users/has-permission - Check if user has permission
 */
export class AdminApiGroup extends HttpApiGroup.make('admin')
  .add(
    HttpApiEndpoint.get('listOrganizations', '/organizations')
      .addSuccess(
        Schema.Struct({
          organizations: Schema.Array(OrganizationWithMemberCount),
        }),
      )
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.get('listSessions', '/sessions')
      .addSuccess(Schema.Struct({ sessions: Schema.Array(SessionWithUser) }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.get('listMembers', '/members')
      .addSuccess(Schema.Struct({ members: Schema.Array(MemberWithDetails) }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('createUser', '/users')
      .setPayload(CreateUserInput)
      .addSuccess(Schema.Struct({ user: Schema.Unknown }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.patch('updateUser', '/users/:userId')
      .setPayload(AdminUpdateUserInput)
      .addSuccess(Schema.Struct({ success: Schema.Boolean }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('setRole', '/users/set-role')
      .setPayload(SetRoleInput)
      .addSuccess(Schema.Struct({ success: Schema.Boolean }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('banUser', '/users/ban')
      .setPayload(BanUserInput)
      .addSuccess(Schema.Struct({ success: Schema.Boolean }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('setUserPassword', '/users/set-password')
      .setPayload(SetUserPasswordInput)
      .addSuccess(Schema.Struct({ success: Schema.Boolean }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('hasPermission', '/users/has-permission')
      .setPayload(HasPermissionInput)
      .addSuccess(Schema.Struct({ hasPermission: Schema.Boolean }))
      .addError(AuthError),
  )
  .prefix('/admin') {}
