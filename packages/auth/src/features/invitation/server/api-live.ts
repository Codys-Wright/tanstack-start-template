import * as HttpApiBuilder from '@effect/platform/HttpApiBuilder';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { AuthApi } from '../../../../core/auth-api';
import { InvitationService } from './service';
import { AuthError } from '../../../../features/session/domain/api';

/**
 * InvitationApiLive - HTTP API handlers for invitation group.
 */
export const InvitationApiLive = HttpApiBuilder.group(AuthApi, 'invitations', (handlers) =>
  handlers
    .handle('listInvitations', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Invitation API] Listing invitations');
        const invitation = yield* InvitationService;
        return yield* invitation.listInvitations();
      }),
    )
    .handle('sendInvitation', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Invitation API] Sending invitation', payload.email);
        const invitation = yield* InvitationService;
        const result = yield* invitation.sendInvitation(payload);
        return { invitation: result };
      }),
    )
    .handle('acceptInvitation', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Invitation API] Accepting invitation', payload.invitationId);
        const invitation = yield* InvitationService;
        return yield* invitation.acceptInvitation(payload.invitationId);
      }),
    )
    .handle('cancelInvitation', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Invitation API] Canceling invitation', payload.invitationId);
        const invitation = yield* InvitationService;
        return yield* invitation.cancelInvitation(payload.invitationId);
      }),
    ).pipe(Layer.provide(InvitationService.Default));
