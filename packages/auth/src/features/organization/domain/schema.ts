import * as Schema from 'effect/Schema';

/**
 * Branded Organization ID type for type safety
 */
export const OrganizationId = Schema.String.pipe(Schema.brand('OrganizationId'));
export type OrganizationId = typeof OrganizationId.Type;

/**
 * Organization entity
 */
export class Organization extends Schema.Class<Organization>('Organization')({
  id: OrganizationId,
  name: Schema.String,
  slug: Schema.String,
  logo: Schema.NullOr(Schema.String),
  metadata: Schema.optional(Schema.Unknown), // JSON metadata
  createdAt: Schema.DateTimeUtc,
}) {}

/**
 * OrganizationRole entity - for dynamic access control
 * Allows creating custom roles at runtime with specific permissions
 */
export class OrganizationRoleEntity extends Schema.Class<OrganizationRoleEntity>(
  'OrganizationRoleEntity',
)({
  id: Schema.String.pipe(Schema.brand('OrganizationRoleId')),
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
