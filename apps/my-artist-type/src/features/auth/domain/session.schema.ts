import * as Schema from "effect/Schema";
import { UserId } from "./user.schema.js";

/**
 * Session entity matching Better Auth OpenAPI spec
 * 
 * Includes organization plugin fields:
 * - activeOrganizationId: Currently active organization
 * - activeTeamId: Currently active team
 * 
 * Includes admin plugin fields:
 * - impersonatedBy: ID of admin impersonating this session
 */
export class Session extends Schema.Class<Session>("Session")({
	id: Schema.String,
	expiresAt: Schema.DateTimeUtc,
	token: Schema.String,
	createdAt: Schema.DateTimeUtc,
	updatedAt: Schema.DateTimeUtc,
	ipAddress: Schema.optional(Schema.String),
	userAgent: Schema.optional(Schema.String),
	userId: UserId,
	
	// Organization plugin fields
	activeOrganizationId: Schema.optional(Schema.NullOr(Schema.String)),
	activeTeamId: Schema.optional(Schema.NullOr(Schema.String)),
	
	// Admin plugin field
	impersonatedBy: Schema.optional(Schema.NullOr(Schema.String)),
}) {}

// NOTE: SessionData is exported from auth.schema.ts to avoid circular dependencies
