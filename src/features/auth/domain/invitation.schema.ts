import * as Schema from "effect/Schema";
import { UserId } from "./user.schema.js";
import { OrganizationId } from "./organization.schema.js";
import { OrganizationRole } from "./member.schema.js";

/**
 * Invitation status
 */
export const InvitationStatus = Schema.Literal("pending", "accepted", "rejected", "canceled");
export type InvitationStatus = typeof InvitationStatus.Type;

/**
 * Invitation entity - represents an invitation to join an organization
 */
export class Invitation extends Schema.Class<Invitation>("Invitation")({
	id: Schema.String.pipe(Schema.brand("InvitationId")),
	organizationId: OrganizationId,
	email: Schema.String,
	role: OrganizationRole,
	status: InvitationStatus,
	expiresAt: Schema.DateTimeUtc,
	createdAt: Schema.DateTimeUtc,
	inviterId: Schema.optional(UserId),
	organizationName: Schema.optional(Schema.String),
	
	// Team support (when teams plugin is enabled)
	teamId: Schema.optional(Schema.NullOr(Schema.String)),
}) {}
