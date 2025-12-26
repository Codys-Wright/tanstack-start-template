import * as Schema from "effect/Schema";
import { OrganizationId } from "./organization.schema.js";

/**
 * OrganizationRole entity - for dynamic access control
 * Allows creating custom roles at runtime with specific permissions
 */
export class OrganizationRoleEntity extends Schema.Class<OrganizationRoleEntity>("OrganizationRoleEntity")({
	id: Schema.String.pipe(Schema.brand("OrganizationRoleId")),
	organizationId: OrganizationId,
	role: Schema.String,
	permission: Schema.String, // JSON string of permissions map
	createdAt: Schema.DateTimeUtc,
	updatedAt: Schema.DateTimeUtc,
}) {}

/**
 * Permission map type
 * Example: { "project": ["create", "update"], "member": ["read"] }
 */
export const PermissionMap = Schema.Record({
	key: Schema.String,
	value: Schema.Array(Schema.String),
});
export type PermissionMap = typeof PermissionMap.Type;
