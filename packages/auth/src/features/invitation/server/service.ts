import * as Effect from 'effect/Effect';
import { authClient } from '../../session/client/client.js';

/**
 * Invitation Service - Wraps invitation operations in Effect
 *
 * Uses organization client methods for:
 * - List invitations
 * - Send invitations
 * - Accept invitations
 * - Cancel invitations
 */
export class InvitationService extends Effect.Service<InvitationService>()('InvitationService', {
  dependencies: [],
  effect: Effect.sync(() => ({
    /**
     * List invitations for current user
     */
    listInvitations: () =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.organization.listInvitations();
          return result.data || [];
        },
        catch: (error) => new Error(`Failed to list invitations: ${error}`),
      }),

    /**
     * Send an invitation
     */
    sendInvitation: (input: {
      email: string;
      role: string;
      organizationId?: string;
      teamId?: string;
    }) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.organization.inviteMember(input);
          return result.data;
        },
        catch: (error) => new Error(`Failed to send invitation: ${error}`),
      }),

    /**
     * Accept an invitation
     */
    acceptInvitation: (invitationId: string) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.organization.acceptInvitation({
            invitationId,
          });
          return result.data;
        },
        catch: (error) => new Error(`Failed to accept invitation: ${error}`),
      }),

    /**
     * Cancel an invitation
     */
    cancelInvitation: (invitationId: string) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.organization.cancelInvitation({
            invitationId,
          });
          return result.data;
        },
        catch: (error) => new Error(`Failed to cancel invitation: ${error}`),
      }),
  })),
}) {}
