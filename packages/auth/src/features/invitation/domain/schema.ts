import * as Schema from 'effect/Schema';
import * as HttpApiSchema from '@effect/platform/HttpApiSchema';

/**
 * Branded InvitationId type for type safety
 */
export const InvitationId = Schema.String.pipe(Schema.brand('InvitationId'));
export type InvitationId = typeof InvitationId.Type;

/**
 * Invitation status
 */
export const InvitationStatus = Schema.Literal('pending', 'accepted', 'rejected', 'canceled');
export type InvitationStatus = typeof InvitationStatus.Type;

/**
 * Invitation entity - represents an invitation to join an organization
 * Matches Better Auth OpenAPI spec
 */
export class Invitation extends Schema.Class<Invitation>('Invitation')({
  id: Schema.String,
  organizationId: Schema.String,
  email: Schema.String,
  role: Schema.String,
  status: Schema.String,
  expiresAt: Schema.String, // ISO date string
  createdAt: Schema.String, // ISO date string
  inviterId: Schema.String,
  teamId: Schema.optional(Schema.NullOr(Schema.String)),
}) {}

/**
 * Invitation with additional details for display
 */
export const InvitationWithDetails = Schema.Struct({
  id: Schema.String,
  organizationId: Schema.String,
  email: Schema.String,
  role: Schema.String,
  status: Schema.String,
  expiresAt: Schema.String,
  createdAt: Schema.String,
  inviterId: Schema.optional(Schema.String),
  organizationName: Schema.optional(Schema.String),
  teamId: Schema.optional(Schema.NullOr(Schema.String)),
  inviterName: Schema.optional(Schema.NullOr(Schema.String)),
});
export type InvitationWithDetails = typeof InvitationWithDetails.Type;

// ============================================================================
// Input Schemas (matching Better Auth OpenAPI spec)
// ============================================================================

/**
 * Input for POST /invitation/accept (maps to /organization/accept-invitation)
 */
export const AcceptInvitationInput = Schema.Struct({
  invitationId: Schema.String,
});
export type AcceptInvitationInput = typeof AcceptInvitationInput.Type;

/**
 * Input for POST /invitation/reject (maps to /organization/reject-invitation)
 */
export const RejectInvitationInput = Schema.Struct({
  invitationId: Schema.String,
});
export type RejectInvitationInput = typeof RejectInvitationInput.Type;

/**
 * Input for POST /invitation/cancel (maps to /organization/cancel-invitation)
 */
export const CancelInvitationInput = Schema.Struct({
  invitationId: Schema.String,
});
export type CancelInvitationInput = typeof CancelInvitationInput.Type;

/**
 * Input for GET /invitation/get (query params)
 */
export const GetInvitationInput = Schema.Struct({
  invitationId: Schema.String,
});
export type GetInvitationInput = typeof GetInvitationInput.Type;

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * Response from accept invitation
 */
export const AcceptInvitationResponse = Schema.Struct({
  invitation: Schema.optional(Schema.Unknown),
  member: Schema.optional(Schema.Unknown),
});
export type AcceptInvitationResponse = typeof AcceptInvitationResponse.Type;

/**
 * Standard success response
 */
export const InvitationSuccessResponse = Schema.Struct({
  success: Schema.Boolean,
});
export type InvitationSuccessResponse = typeof InvitationSuccessResponse.Type;

// ============================================================================
// Errors
// ============================================================================

/**
 * Invitation error - generic invitation operation error
 */
export class InvitationError extends Schema.TaggedError<InvitationError>()(
  'InvitationError',
  { message: Schema.String },
  HttpApiSchema.annotations({ status: 400 }),
) {}

// Legacy exports for backward compatibility
export const SendInvitationInput = Schema.Struct({
  email: Schema.String,
  role: Schema.String,
  organizationId: Schema.optional(Schema.NullOr(Schema.String)),
  teamId: Schema.optional(Schema.String),
});
export type SendInvitationInput = typeof SendInvitationInput.Type;
