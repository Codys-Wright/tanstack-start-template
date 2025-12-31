import * as Schema from 'effect/Schema';
import * as HttpApiSchema from '@effect/platform/HttpApiSchema';

/**
 * Branded Organization ID type for type safety
 */
export const OrganizationId = Schema.String.pipe(Schema.brand('OrganizationId'));
export type OrganizationId = typeof OrganizationId.Type;

/**
 * Organization entity matching Better Auth OpenAPI spec
 *
 * Custom fields:
 * - fake: Whether this is a fake/test organization (readOnly)
 */
export class Organization extends Schema.Class<Organization>('Organization')({
  id: OrganizationId,
  name: Schema.String,
  slug: Schema.String,
  logo: Schema.NullOr(Schema.String),
  // metadata is stored as JSON string in Better Auth
  metadata: Schema.optional(Schema.NullOr(Schema.String)),
  createdAt: Schema.DateTimeUtc,

  // Custom fields (readOnly)
  fake: Schema.optional(Schema.Boolean),
}) {}

/**
 * Organization member entity matching Better Auth OpenAPI spec
 * Note: Named OrganizationMember to avoid conflict with member feature
 */
export const OrganizationMember = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  organizationId: Schema.String,
  role: Schema.String,
  createdAt: Schema.optional(Schema.DateTimeUtc),
});
export type OrganizationMember = typeof OrganizationMember.Type;

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

// ============================================================================
// Input Schemas (matching Better Auth OpenAPI spec)
// ============================================================================

/**
 * Input for POST /organization/create
 */
export const CreateOrganizationInput = Schema.Struct({
  name: Schema.String,
  slug: Schema.String,
  logo: Schema.optional(Schema.NullOr(Schema.String)),
  metadata: Schema.optional(Schema.NullOr(Schema.String)),
  userId: Schema.optional(Schema.NullOr(Schema.String)),
  keepCurrentActiveOrganization: Schema.optional(Schema.NullOr(Schema.Boolean)),
});
export type CreateOrganizationInput = typeof CreateOrganizationInput.Type;

/**
 * Input for POST /organization/update
 * Note: Better Auth uses { data: {...}, organizationId? } structure
 */
export const UpdateOrganizationInput = Schema.Struct({
  organizationId: Schema.optional(Schema.NullOr(Schema.String)),
  data: Schema.Struct({
    name: Schema.optional(Schema.NullOr(Schema.String)),
    slug: Schema.optional(Schema.NullOr(Schema.String)),
    logo: Schema.optional(Schema.NullOr(Schema.String)),
    metadata: Schema.optional(Schema.NullOr(Schema.String)),
  }),
});
export type UpdateOrganizationInput = typeof UpdateOrganizationInput.Type;

/**
 * Input for POST /organization/delete
 */
export const DeleteOrganizationInput = Schema.Struct({
  organizationId: Schema.String,
});
export type DeleteOrganizationInput = typeof DeleteOrganizationInput.Type;

/**
 * Input for POST /organization/set-active
 */
export const SetActiveOrganizationInput = Schema.Struct({
  organizationId: Schema.optional(Schema.NullOr(Schema.String)),
  organizationSlug: Schema.optional(Schema.NullOr(Schema.String)),
});
export type SetActiveOrganizationInput = typeof SetActiveOrganizationInput.Type;

/**
 * Input for POST /organization/leave
 */
export const LeaveOrganizationInput = Schema.Struct({
  organizationId: Schema.String,
});
export type LeaveOrganizationInput = typeof LeaveOrganizationInput.Type;

/**
 * Input for POST /organization/check-slug
 */
export const CheckSlugInput = Schema.Struct({
  slug: Schema.String,
});
export type CheckSlugInput = typeof CheckSlugInput.Type;

/**
 * Input for POST /organization/has-permission
 * Note: Named OrgHasPermissionInput to avoid conflict with admin feature
 */
export const OrgHasPermissionInput = Schema.Struct({
  permission: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.Array(Schema.String) }),
  ),
  permissions: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.Array(Schema.String) }),
  ),
});
export type OrgHasPermissionInput = typeof OrgHasPermissionInput.Type;

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * Response from POST /organization/has-permission
 * Note: Named OrgHasPermissionResponse to avoid conflict with admin feature
 */
export const OrgHasPermissionResponse = Schema.Struct({
  success: Schema.Boolean,
  error: Schema.optional(Schema.String),
});
export type OrgHasPermissionResponse = typeof OrgHasPermissionResponse.Type;

/**
 * Response from POST /organization/check-slug
 */
export const CheckSlugResponse = Schema.Struct({
  status: Schema.Boolean,
});
export type CheckSlugResponse = typeof CheckSlugResponse.Type;

/**
 * Standard success response
 */
export const OrganizationSuccessResponse = Schema.Struct({
  success: Schema.Boolean,
});
export type OrganizationSuccessResponse = typeof OrganizationSuccessResponse.Type;

// ============================================================================
// Errors
// ============================================================================

/**
 * Organization-related errors
 */
export class OrganizationNotFoundError extends Schema.TaggedError<OrganizationNotFoundError>()(
  'OrganizationNotFoundError',
  { id: Schema.String },
  HttpApiSchema.annotations({ status: 404 }),
) {}

export class OrganizationValidationError extends Schema.TaggedError<OrganizationValidationError>()(
  'OrganizationValidationError',
  { message: Schema.String },
  HttpApiSchema.annotations({ status: 400 }),
) {}

export class OrganizationError extends Schema.TaggedError<OrganizationError>()(
  'OrganizationError',
  { message: Schema.String },
  HttpApiSchema.annotations({ status: 400 }),
) {}
