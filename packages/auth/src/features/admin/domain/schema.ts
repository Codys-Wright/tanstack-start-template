import * as Schema from 'effect/Schema';
import { User } from '../../user/domain/schema.js';
import { OrganizationRole } from '../../member/domain/schema.js';

/**
 * Admin RPC Response Schemas
 * These schemas define the response types for admin data fetching operations
 */

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
 * Note: Re-exported from invitation domain for admin convenience
 */
export { InvitationWithDetails } from '../../invitation/domain/schema.js';

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

// Re-export User for convenience
export { User };
