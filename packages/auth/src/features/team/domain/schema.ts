import * as Schema from 'effect/Schema';
import * as HttpApiSchema from '@effect/platform/HttpApiSchema';
import { OrganizationId } from '@auth/features/organization/domain/schema';
import { UserId } from '@auth/features/user/domain/schema';

/**
 * Branded Team ID type for type safety
 */
export const TeamId = Schema.String.pipe(Schema.brand('TeamId'));
export type TeamId = typeof TeamId.Type;

/**
 * Branded TeamMember ID type for type safety
 */
export const TeamMemberId = Schema.String.pipe(Schema.brand('TeamMemberId'));
export type TeamMemberId = typeof TeamMemberId.Type;

/**
 * Team entity - represents a team within an organization
 */
export class Team extends Schema.Class<Team>('Team')({
  id: TeamId,
  name: Schema.String,
  organizationId: OrganizationId,
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.optional(Schema.DateTimeUtc),
}) {}

/**
 * TeamMember entity - represents a user's membership in a team
 */
export class TeamMember extends Schema.Class<TeamMember>('TeamMember')({
  id: TeamMemberId,
  teamId: TeamId,
  userId: UserId,
  createdAt: Schema.DateTimeUtc,
}) {}

/**
 * User info embedded in TeamMemberWithUser
 */
const TeamMemberUserInfo = Schema.Struct({
  id: UserId,
  name: Schema.String,
  email: Schema.String,
  image: Schema.NullOr(Schema.String),
});

/**
 * TeamMember with user details populated
 * Used in API responses for listing team members
 */
export class TeamMemberWithUser extends Schema.Class<TeamMemberWithUser>('TeamMemberWithUser')({
  id: TeamMemberId,
  teamId: TeamId,
  userId: UserId,
  createdAt: Schema.DateTimeUtc,
  user: TeamMemberUserInfo,
}) {}

/**
 * Team permissions interface
 */
export interface TeamPermissions {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
}

// ============================================================================
// Input Schemas (matching Better Auth OpenAPI spec)
// ============================================================================

/**
 * Input for POST /organization/create-team
 */
export const CreateTeamInput = Schema.Struct({
  name: Schema.String,
  organizationId: Schema.optional(Schema.NullOr(Schema.String)),
});
export type CreateTeamInput = typeof CreateTeamInput.Type;

/**
 * Input for POST /organization/update-team
 */
export const UpdateTeamInput = Schema.Struct({
  teamId: Schema.String,
  data: Schema.Struct({
    name: Schema.optional(Schema.NullOr(Schema.String)),
  }),
});
export type UpdateTeamInput = typeof UpdateTeamInput.Type;

/**
 * Input for POST /organization/remove-team
 */
export const RemoveTeamInput = Schema.Struct({
  teamId: Schema.String,
  organizationId: Schema.optional(Schema.NullOr(Schema.String)),
});
export type RemoveTeamInput = typeof RemoveTeamInput.Type;

/**
 * Input for POST /organization/add-team-member
 */
export const AddTeamMemberInput = Schema.Struct({
  teamId: Schema.String,
  userId: Schema.String,
  role: Schema.optional(Schema.String),
});
export type AddTeamMemberInput = typeof AddTeamMemberInput.Type;

/**
 * Input for POST /organization/remove-team-member
 */
export const RemoveTeamMemberInput = Schema.Struct({
  teamId: Schema.String,
  userId: Schema.String,
});
export type RemoveTeamMemberInput = typeof RemoveTeamMemberInput.Type;

/**
 * Input for POST /organization/set-active-team
 */
export const SetActiveTeamInput = Schema.Struct({
  teamId: Schema.NullOr(Schema.String),
});
export type SetActiveTeamInput = typeof SetActiveTeamInput.Type;

/**
 * Input for GET /organization/list-team-members (query params)
 */
export const ListTeamMembersInput = Schema.Struct({
  teamId: Schema.String,
});
export type ListTeamMembersInput = typeof ListTeamMembersInput.Type;

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * Standard success response
 */
export const TeamSuccessResponse = Schema.Struct({
  success: Schema.Boolean,
});
export type TeamSuccessResponse = typeof TeamSuccessResponse.Type;

// ============================================================================
// Errors
// ============================================================================

/**
 * Team error - generic team operation error
 */
export class TeamError extends Schema.TaggedError<TeamError>()(
  'TeamError',
  { message: Schema.String },
  HttpApiSchema.annotations({ status: 400 }),
) {}
