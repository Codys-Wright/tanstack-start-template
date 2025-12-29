import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint';
import * as HttpApiGroup from '@effect/platform/HttpApiGroup';
import * as Schema from 'effect/Schema';
import { Invitation, InvitationStatus, InvitationWithDetails, InvitationId } from './schema.js';
import { AuthError } from '../session/domain/schema.js';

export class InvitationApiGroup extends HttpApiGroup.make('invitations')
  .add(
    HttpApiEndpoint.get('listInvitations', '/')
      .addSuccess(Schema.Struct({ invitations: Schema.Array(InvitationWithDetails) }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('sendInvitation', '/send')
      .setPayload(
        Schema.Struct({
          email: Schema.String,
          role: Schema.Literal('owner', 'admin', 'member'),
          organizationId: Schema.optional(Schema.String),
          teamId: Schema.optional(Schema.String),
        }),
      )
      .addSuccess(Schema.Struct({ invitation: Invitation }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('acceptInvitation', '/accept')
      .setPayload(Schema.Struct({ invitationId: InvitationId }))
      .addSuccess(Schema.Struct({ success: Schema.Boolean }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('cancelInvitation', '/cancel')
      .setPayload(Schema.Struct({ invitationId: InvitationId }))
      .addSuccess(Schema.Struct({ success: Schema.Boolean }))
      .addError(AuthError),
  )
  .prefix('/invitations') {}
