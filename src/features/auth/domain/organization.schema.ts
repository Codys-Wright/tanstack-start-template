import * as Schema from "effect/Schema";
import { UserId } from "./auth.user-id.js";

// Branded types
export const OrganizationId = Schema.String.pipe(
	Schema.brand("OrganizationId"),
);
export type OrganizationId = typeof OrganizationId.Type;

export const OrganizationRole = Schema.Literal("owner", "admin", "member");
export type OrganizationRole = typeof OrganizationRole.Type;

// Main entities
export const Organization = Schema.Struct({
	id: OrganizationId,
	name: Schema.String,
	slug: Schema.String,
	logo: Schema.NullOr(Schema.String),
	metadata: Schema.optional(Schema.Unknown),
	createdAt: Schema.DateTimeUtc,
});
export type Organization = typeof Organization.Type;

export const Member = Schema.Struct({
	id: Schema.String,
	organizationId: OrganizationId,
	userId: UserId,
	role: OrganizationRole,
	createdAt: Schema.DateTimeUtc,
	user: Schema.Struct({
		id: UserId,
		name: Schema.String,
		email: Schema.String,
		image: Schema.NullOr(Schema.String),
	}),
});
export type Member = typeof Member.Type;

export const Invitation = Schema.Struct({
	id: Schema.String,
	organizationId: OrganizationId,
	email: Schema.String,
	role: OrganizationRole,
	status: Schema.Literal("pending", "accepted", "rejected", "canceled"),
	expiresAt: Schema.DateTimeUtc,
	inviterId: Schema.optional(UserId),
	organizationName: Schema.optional(Schema.String),
});
export type Invitation = typeof Invitation.Type;

// Input schemas with validation
export const CreateOrganizationInput = Schema.Struct({
	name: Schema.String.pipe(
		Schema.minLength(1, {
			message: () => "Organization name is required",
		}),
		Schema.maxLength(100, {
			message: () => "Organization name must be less than 100 characters",
		}),
	),
	slug: Schema.optional(
		Schema.String.pipe(
			Schema.pattern(/^[a-z0-9-]+$/, {
				message: () =>
					"Slug can only contain lowercase letters, numbers, and hyphens",
			}),
			Schema.minLength(3, {
				message: () => "Slug must be at least 3 characters",
			}),
			Schema.maxLength(50, {
				message: () => "Slug must be less than 50 characters",
			}),
		),
	),
});
export type CreateOrganizationInput = typeof CreateOrganizationInput.Type;

export const UpdateOrganizationInput = Schema.Struct({
	name: Schema.optional(
		Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
	),
	slug: Schema.optional(
		Schema.String.pipe(
			Schema.pattern(/^[a-z0-9-]+$/),
			Schema.minLength(3),
		),
	),
	logo: Schema.optional(Schema.NullOr(Schema.String)),
});
export type UpdateOrganizationInput = typeof UpdateOrganizationInput.Type;

export const InviteMemberInput = Schema.Struct({
	organizationId: OrganizationId,
	email: Schema.String.pipe(
		Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
			message: () => "Invalid email address",
		}),
	),
	role: OrganizationRole,
});
export type InviteMemberInput = typeof InviteMemberInput.Type;

export const UpdateMemberRoleInput = Schema.Struct({
	memberId: Schema.String,
	role: OrganizationRole,
});
export type UpdateMemberRoleInput = typeof UpdateMemberRoleInput.Type;
