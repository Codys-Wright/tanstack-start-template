import * as Schema from 'effect/Schema';
import { UserId } from '@auth/features/user/domain/schema';
import { OrganizationId } from '@auth/features/organization/domain/schema';
import { OrganizationRole } from '@auth/features/member/domain/schema';
import { TeamId } from '@auth/features/team/domain/schema';

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
 */
export class Invitation extends Schema.Class<Invitation>('Invitation')({
  id: InvitationId,
  organizationId: OrganizationId,
  email: Schema.String,
  role: OrganizationRole,
  status: InvitationStatus,
  expiresAt: Schema.DateTimeUtc,
  createdAt: Schema.DateTimeUtc,
  inviterId: Schema.optional(UserId),
  organizationName: Schema.optional(Schema.String),

  // Team support (when teams plugin is enabled)
  teamId: Schema.optional(Schema.NullOr(TeamId)),
}) {}

/**
 * Invitation with additional details for display
 */
export const InvitationWithDetails = Schema.Struct({
  id: Schema.String,
  organizationId: Schema.String,
  email: Schema.String,
  role: Schema.String,
  status: InvitationStatus,
  expiresAt: Schema.DateTimeUtc,
  createdAt: Schema.DateTimeUtc,
  inviterId: Schema.optional(Schema.String),
  organizationName: Schema.String,
  teamId: Schema.optional(Schema.NullOr(Schema.String)),
  inviterName: Schema.optional(Schema.NullOr(Schema.String)),
});
export type InvitationWithDetails = typeof InvitationWithDetails.Type;

/**
 * Input for sending an invitation
 */
export const SendInvitationInput = Schema.Struct({
  email: Schema.String,
  role: OrganizationRole,
  organizationId: Schema.optional(OrganizationId),
  teamId: Schema.optional(TeamId),
});
export type SendInvitationInput = typeof SendInvitationInput.Type;

/**
 * Input for accepting an invitation
 */
export const AcceptInvitationInput = Schema.Struct({
  invitationId: InvitationId,
});
export type AcceptInvitationInput = typeof AcceptInvitationInput.Type;

/**
 * Input for canceling an invitation
 */
export const CancelInvitationInput = Schema.Struct({
  invitationId: InvitationId,
});
export type CancelInvitationInput = typeof CancelInvitationInput.Type;
