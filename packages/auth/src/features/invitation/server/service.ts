import * as Effect from 'effect/Effect';
import { AuthService } from '@auth/core/server/service';

/**
 * Invitation Service - Wraps Better Auth invitation operations in Effect
 *
 * Uses auth.api.* methods for invitation operations.
 * The organization plugin exposes invitation methods like:
 * - listInvitations, listUserInvitations, getInvitation
 * - acceptInvitation, rejectInvitation, cancelInvitation
 *
 * Note: We use type assertion (as any) because Better Auth's TypeScript types
 * don't fully expose plugin-added methods, but they exist at runtime.
 */
export class InvitationService extends Effect.Service<InvitationService>()('InvitationService', {
  dependencies: [AuthService.Default],
  effect: Effect.gen(function* () {
    const auth = yield* AuthService;
    // Type assertion needed because Better Auth types don't fully expose plugin methods
    const api = auth.api as any;

    return {
      /**
       * List invitations for organization
       */
      list: () =>
        Effect.tryPromise({
          try: () => api.listInvitations({}),
          catch: (error) => new Error(`Failed to list invitations: ${error}`),
        }),

      /**
       * List invitations for current user
       */
      listUser: () =>
        Effect.tryPromise({
          try: () => api.listUserInvitations({}),
          catch: (error) => new Error(`Failed to list user invitations: ${error}`),
        }),

      /**
       * Get a specific invitation
       */
      get: (input: { invitationId: string }) =>
        Effect.tryPromise({
          try: () => api.getInvitation({ query: input }),
          catch: (error) => new Error(`Failed to get invitation: ${error}`),
        }),

      /**
       * Accept an invitation
       */
      accept: (input: { invitationId: string }) =>
        Effect.tryPromise({
          try: () => api.acceptInvitation({ body: input }),
          catch: (error) => new Error(`Failed to accept invitation: ${error}`),
        }),

      /**
       * Reject an invitation
       */
      reject: (input: { invitationId: string }) =>
        Effect.tryPromise({
          try: () => api.rejectInvitation({ body: input }),
          catch: (error) => new Error(`Failed to reject invitation: ${error}`),
        }),

      /**
       * Cancel an invitation
       */
      cancel: (input: { invitationId: string }) =>
        Effect.tryPromise({
          try: () => api.cancelInvitation({ body: input }),
          catch: (error) => new Error(`Failed to cancel invitation: ${error}`),
        }),
    };
  }),
}) {}
