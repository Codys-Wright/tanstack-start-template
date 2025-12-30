import * as Schema from 'effect/Schema';
import { UserId } from '../../user/domain/schema';
import { OrganizationId } from '../../organization/domain/schema';
import { AuthError } from '../../session/domain/schema';

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

/**
 * Input for inviting a member
 */
export const InviteMemberInput = Schema.Struct({
  email: Schema.String,
  role: OrganizationRole,
  organizationId: Schema.optional(OrganizationId),
});
export type InviteMemberInput = typeof InviteMemberInput.Type;

/**
 * Input for updating member role
 */
export const UpdateMemberRoleInput = Schema.Struct({
  memberId: MemberId,
  role: OrganizationRole,
  organizationId: Schema.optional(OrganizationId),
});
export type UpdateMemberRoleInput = typeof UpdateMemberRoleInput.Type;

/**
 * Input for removing a member
 */
export const RemoveMemberInput = Schema.Struct({
  memberIdOrEmail: Schema.String,
  organizationId: Schema.optional(OrganizationId),
});
export type RemoveMemberInput = typeof RemoveMemberInput.Type;

/**
 * Member-related errors
 */
export class MemberNotFoundError extends Schema.TaggedError<MemberNotFoundError>()(
  'MemberNotFoundError',
  { message: Schema.String },
) {}

export class InvalidRoleError extends Schema.TaggedError<InvalidRoleError>()('InvalidRoleError', {
  message: Schema.String,
}) {}
