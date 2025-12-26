import * as Schema from "effect/Schema";
import { UserId } from "./auth.user-id.js";
import { OrganizationId } from "./organization.schema.js";

// Branded types
export const TeamId = Schema.String.pipe(Schema.brand("TeamId"));
export type TeamId = typeof TeamId.Type;

export const TeamRole = Schema.Literal("owner", "member");
export type TeamRole = typeof TeamRole.Type;

// Main entities
export const Team = Schema.Struct({
	id: TeamId,
	name: Schema.String,
	organizationId: OrganizationId,
	createdAt: Schema.DateTimeUtc,
});
export type Team = typeof Team.Type;

export const TeamMember = Schema.Struct({
	id: Schema.String,
	teamId: TeamId,
	userId: UserId,
	role: TeamRole,
	user: Schema.Struct({
		id: UserId,
		name: Schema.String,
		email: Schema.String,
		image: Schema.NullOr(Schema.String),
	}),
});
export type TeamMember = typeof TeamMember.Type;

// Input schemas
export const CreateTeamInput = Schema.Struct({
	organizationId: OrganizationId,
	name: Schema.String.pipe(
		Schema.minLength(1, {
			message: () => "Team name is required",
		}),
		Schema.maxLength(50, {
			message: () => "Team name must be less than 50 characters",
		}),
	),
});
export type CreateTeamInput = typeof CreateTeamInput.Type;

export const UpdateTeamInput = Schema.Struct({
	name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(50)),
});
export type UpdateTeamInput = typeof UpdateTeamInput.Type;

export const AddTeamMemberInput = Schema.Struct({
	teamId: TeamId,
	userId: UserId,
	role: TeamRole,
});
export type AddTeamMemberInput = typeof AddTeamMemberInput.Type;
