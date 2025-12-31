import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint';
import * as HttpApiGroup from '@effect/platform/HttpApiGroup';
import * as Schema from 'effect/Schema';
import {
  Invitation,
  InvitationWithDetails,
  AcceptInvitationInput,
  RejectInvitationInput,
  CancelInvitationInput,
  GetInvitationInput,
  AcceptInvitationResponse,
  InvitationSuccessResponse,
  InvitationError,
} from './schema.js';

/**
 * InvitationApiGroup - HTTP API group for invitation management.
 * Matches Better Auth Organization Plugin invitation endpoints.
 *
 * This is composed into AuthApi.
 *
 * Endpoints (matching Better Auth):
 * - GET /invitation/list - List invitations for organization
 * - GET /invitation/list-user - List invitations for current user
 * - GET /invitation/get - Get a specific invitation
 * - POST /invitation/accept - Accept an invitation
 * - POST /invitation/reject - Reject an invitation
 * - POST /invitation/cancel - Cancel an invitation
 */
export class InvitationApiGroup extends HttpApiGroup.make('invitation')
  // List invitations for organization
  .add(
    HttpApiEndpoint.get('list', '/list')
      .addSuccess(Schema.Array(InvitationWithDetails))
      .addError(InvitationError),
  )
  // List invitations for current user
  .add(
    HttpApiEndpoint.get('listUser', '/list-user')
      .addSuccess(Schema.Array(InvitationWithDetails))
      .addError(InvitationError),
  )
  // Get a specific invitation
  .add(
    HttpApiEndpoint.get('get', '/get')
      .setUrlParams(GetInvitationInput)
      .addSuccess(Schema.NullOr(Invitation))
      .addError(InvitationError),
  )
  // Accept invitation
  .add(
    HttpApiEndpoint.post('accept', '/accept')
      .setPayload(AcceptInvitationInput)
      .addSuccess(AcceptInvitationResponse)
      .addError(InvitationError),
  )
  // Reject invitation
  .add(
    HttpApiEndpoint.post('reject', '/reject')
      .setPayload(RejectInvitationInput)
      .addSuccess(InvitationSuccessResponse)
      .addError(InvitationError),
  )
  // Cancel invitation
  .add(
    HttpApiEndpoint.post('cancel', '/cancel')
      .setPayload(CancelInvitationInput)
      .addSuccess(InvitationSuccessResponse)
      .addError(InvitationError),
  )
  .prefix('/invitation') {}
