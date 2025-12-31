import * as Schema from 'effect/Schema';
import * as HttpApiSchema from '@effect/platform/HttpApiSchema';
import { UserId } from '@auth/features/user/domain/schema';
import { OrganizationId } from '@auth/features/organization/domain/schema';

/**
 * Branded MemberId type for type safety
 */
export const MemberId = Schema.String.pipe(Schema.brand('MemberId'));
export type MemberId = typeof MemberId.Type;

/**
 * Organization role type
 * Default roles: owner, admin, member
 * Can be extended with custom roles via dynamic access control
 */
export const OrganizationRole = Schema.Union(
  Schema.Literal('owner'),
  Schema.Literal('admin'),
  Schema.Literal('member'),
  Schema.String, // Custom roles
);
export type OrganizationRole = typeof OrganizationRole.Type;

/**
 * Member entity - represents a user's membership in an organization
 */
export class Member extends Schema.Class<Member>('Member')({
  id: MemberId,
  organizationId: OrganizationId,
  userId: UserId,
  role: OrganizationRole,
  createdAt: Schema.DateTimeUtc,
}) {}

/**
 * User info embedded in MemberWithUser
 */
const MemberUserInfo = Schema.Struct({
  id: UserId,
  name: Schema.String,
  email: Schema.String,
  image: Schema.NullOr(Schema.String),
});

/**
 * Member with user details populated
 * Used in API responses for listing members
 */
export class MemberWithUser extends Schema.Class<MemberWithUser>('MemberWithUser')({
  id: MemberId,
  organizationId: OrganizationId,
  userId: UserId,
  role: OrganizationRole,
  createdAt: Schema.DateTimeUtc,
  user: MemberUserInfo,
}) {}

/**
 * Member with full details including organization info
 * Used in admin views
 */
export const MemberWithFullDetails = Schema.Struct({
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
export type MemberWithFullDetails = typeof MemberWithFullDetails.Type;

// ============================================================================
// Input Schemas (matching Better Auth OpenAPI spec)
// ============================================================================

/**
 * Input for POST /member/invite (maps to /organization/invite-member)
 */
export const InviteMemberInput = Schema.Struct({
  email: Schema.String,
  role: Schema.String,
  organizationId: Schema.optional(Schema.NullOr(Schema.String)),
  resend: Schema.optional(Schema.NullOr(Schema.Boolean)),
  teamId: Schema.optional(Schema.String),
});
export type InviteMemberInput = typeof InviteMemberInput.Type;

/**
 * Input for POST /member/update-role (maps to /organization/update-member-role)
 */
export const UpdateMemberRoleInput = Schema.Struct({
  memberId: Schema.String,
  role: Schema.String,
  organizationId: Schema.optional(Schema.NullOr(Schema.String)),
});
export type UpdateMemberRoleInput = typeof UpdateMemberRoleInput.Type;

/**
 * Input for POST /member/remove (maps to /organization/remove-member)
 */
export const RemoveMemberInput = Schema.Struct({
  memberIdOrEmail: Schema.String,
  organizationId: Schema.optional(Schema.NullOr(Schema.String)),
});
export type RemoveMemberInput = typeof RemoveMemberInput.Type;

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * Standard success response
 */
export const MemberSuccessResponse = Schema.Struct({
  success: Schema.Boolean,
});
export type MemberSuccessResponse = typeof MemberSuccessResponse.Type;

// ============================================================================
// Errors
// ============================================================================

/**
 * Member-related errors
 */
export class MemberNotFoundError extends Schema.TaggedError<MemberNotFoundError>()(
  'MemberNotFoundError',
  { message: Schema.String },
  HttpApiSchema.annotations({ status: 404 }),
) {}

export class InvalidRoleError extends Schema.TaggedError<InvalidRoleError>()(
  'InvalidRoleError',
  { message: Schema.String },
  HttpApiSchema.annotations({ status: 400 }),
) {}

export class MemberError extends Schema.TaggedError<MemberError>()(
  'MemberError',
  { message: Schema.String },
  HttpApiSchema.annotations({ status: 400 }),
) {}
