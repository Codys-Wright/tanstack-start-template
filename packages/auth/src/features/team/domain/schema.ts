import * as Schema from 'effect/Schema';
import { OrganizationId } from '../../organization/domain/schema.js';
import { UserId } from '../../user/domain/schema.js';

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

/**
 * Input for creating a team
 */
export const CreateTeamInput = Schema.Struct({
  organizationId: OrganizationId,
  name: Schema.String,
});
export type CreateTeamInput = typeof CreateTeamInput.Type;

/**
 * Input for updating a team
 */
export const UpdateTeamInput = Schema.Struct({
  teamId: TeamId,
  data: Schema.Struct({
    name: Schema.String,
  }),
});
export type UpdateTeamInput = typeof UpdateTeamInput.Type;

/**
 * Input for deleting a team
 */
export const DeleteTeamInput = Schema.Struct({
  teamId: TeamId,
  organizationId: Schema.optional(OrganizationId),
});
export type DeleteTeamInput = typeof DeleteTeamInput.Type;

/**
 * Input for adding a team member
 */
export const AddTeamMemberInput = Schema.Struct({
  teamId: TeamId,
  userId: UserId,
  role: Schema.optional(Schema.String),
});
export type AddTeamMemberInput = typeof AddTeamMemberInput.Type;

/**
 * Input for removing a team member
 */
export const RemoveTeamMemberInput = Schema.Struct({
  teamId: TeamId,
  userId: UserId,
});
export type RemoveTeamMemberInput = typeof RemoveTeamMemberInput.Type;

/**
 * Input for setting active team
 */
export const SetActiveTeamInput = Schema.Struct({
  teamId: Schema.NullOr(TeamId),
});
export type SetActiveTeamInput = typeof SetActiveTeamInput.Type;
