import * as HttpApiBuilder from '@effect/platform/HttpApiBuilder';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { AuthApi } from '@auth/core/auth-api';
import { InvitationService } from '@auth/features/invitation/server/service';
import {
  InvitationError,
  type Invitation,
  type InvitationWithDetails,
  type AcceptInvitationResponse,
} from '@auth/features/invitation/domain/schema';

/**
 * InvitationApiLive - HTTP API handlers for invitation group.
 *
 * Implements Better Auth organization plugin invitation endpoints:
 * - list, listUser, get, accept, reject, cancel
 *
 * Note: We use type assertions because Better Auth's runtime response types
 * are not fully typed, but the data matches our schemas at runtime.
 */
export const InvitationApiLive = HttpApiBuilder.group(AuthApi, 'invitation', (handlers) =>
  handlers
    .handle('list', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Invitation API] Listing invitations');
        const invitation = yield* InvitationService;
        const result = yield* invitation.list();
        return result as readonly InvitationWithDetails[];
      }).pipe(Effect.mapError((e) => new InvitationError({ message: String(e) }))),
    )
    .handle('listUser', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Invitation API] Listing user invitations');
        const invitation = yield* InvitationService;
        const result = yield* invitation.listUser();
        return result as readonly InvitationWithDetails[];
      }).pipe(Effect.mapError((e) => new InvitationError({ message: String(e) }))),
    )
    .handle('get', ({ urlParams }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Invitation API] Getting invitation', urlParams.invitationId);
        const invitation = yield* InvitationService;
        const result = yield* invitation.get({
          invitationId: urlParams.invitationId,
        });
        return result as Invitation | null;
      }).pipe(Effect.mapError((e) => new InvitationError({ message: String(e) }))),
    )
    .handle('accept', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Invitation API] Accepting invitation', payload.invitationId);
        const invitation = yield* InvitationService;
        const result = yield* invitation.accept({
          invitationId: payload.invitationId,
        });
        return result as AcceptInvitationResponse;
      }).pipe(Effect.mapError((e) => new InvitationError({ message: String(e) }))),
    )
    .handle('reject', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Invitation API] Rejecting invitation', payload.invitationId);
        const invitation = yield* InvitationService;
        yield* invitation.reject({ invitationId: payload.invitationId });
        return { success: true as const };
      }).pipe(Effect.mapError((e) => new InvitationError({ message: String(e) }))),
    )
    .handle('cancel', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Invitation API] Canceling invitation', payload.invitationId);
        const invitation = yield* InvitationService;
        yield* invitation.cancel({ invitationId: payload.invitationId });
        return { success: true as const };
      }).pipe(Effect.mapError((e) => new InvitationError({ message: String(e) }))),
    ),
).pipe(Layer.provide(InvitationService.Default));
