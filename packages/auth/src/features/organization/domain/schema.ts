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
  metadata: Schema.optional(Schema.Unknown),
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
  permission: Schema.String,
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

/**
 * Input for creating an organization
 */
export const CreateOrganizationInput = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
  slug: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
  logo: Schema.optional(Schema.NullOr(Schema.String)),
  metadata: Schema.optional(Schema.Unknown),
  userId: Schema.optional(Schema.NullOr(Schema.String)),
  keepCurrentActiveOrganization: Schema.optional(Schema.Boolean),
});
export type CreateOrganizationInput = typeof CreateOrganizationInput.Type;

/**
 * Input for updating an organization
 */
export const UpdateOrganizationInput = Schema.Struct({
  organizationId: Schema.String,
  name: Schema.optional(Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100))),
  slug: Schema.optional(Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100))),
  logo: Schema.optional(Schema.NullOr(Schema.String)),
  metadata: Schema.optional(Schema.Unknown),
});
export type UpdateOrganizationInput = typeof UpdateOrganizationInput.Type;

/**
 * Input for deleting an organization
 */
export const DeleteOrganizationInput = Schema.Struct({
  organizationId: Schema.String,
});
export type DeleteOrganizationInput = typeof DeleteOrganizationInput.Type;

/**
 * Input for setting active organization
 */
export const SetActiveOrganizationInput = Schema.Struct({
  organizationId: Schema.optional(Schema.String),
  organizationSlug: Schema.optional(Schema.String),
});
export type SetActiveOrganizationInput = typeof SetActiveOrganizationInput.Type;

/**
 * Organization-related errors
 */
export class OrganizationNotFoundError extends Schema.TaggedError<OrganizationNotFoundError>()(
  'OrganizationNotFoundError',
  { id: Schema.String },
) {}

export class OrganizationValidationError extends Schema.TaggedError<OrganizationValidationError>()(
  'OrganizationValidationError',
  { message: Schema.String },
) {}
