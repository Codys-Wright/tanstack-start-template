import * as Effect from 'effect/Effect';
import { AuthService } from '@auth/core/server/service';

/**
 * Member Service - Wraps Better Auth member operations in Effect
 *
 * Uses auth.api.* methods for member operations.
 * The organization plugin exposes member methods like:
 * - listMembers, inviteMember, updateMemberRole, removeMember
 *
 * Note: We use type assertion (as any) because Better Auth's TypeScript types
 * don't fully expose plugin-added methods, but they exist at runtime.
 */
export class MemberService extends Effect.Service<MemberService>()('MemberService', {
  dependencies: [AuthService.Default],
  effect: Effect.gen(function* () {
    const auth = yield* AuthService;
    // Type assertion needed because Better Auth types don't fully expose plugin methods
    const api = auth.api as any;

    return {
      /**
       * List members of the active organization
       */
      list: () =>
        Effect.tryPromise({
          try: () => api.listMembers({}),
          catch: (error) => new Error(`Failed to list members: ${error}`),
        }),

      /**
       * Invite a member to organization
       */
      invite: (input: {
        email: string;
        role: string;
        organizationId?: string | null;
        resend?: boolean | null;
        teamId?: string;
      }) =>
        Effect.tryPromise({
          try: () => api.inviteMember({ body: input }),
          catch: (error) => new Error(`Failed to invite member: ${error}`),
        }),

      /**
       * Update member role
       */
      updateRole: (input: { memberId: string; role: string; organizationId?: string | null }) =>
        Effect.tryPromise({
          try: () => api.updateMemberRole({ body: input }),
          catch: (error) => new Error(`Failed to update member role: ${error}`),
        }),

      /**
       * Remove a member from organization
       */
      remove: (input: { memberIdOrEmail: string; organizationId?: string | null }) =>
        Effect.tryPromise({
          try: () => api.removeMember({ body: input }),
          catch: (error) => new Error(`Failed to remove member: ${error}`),
        }),
    };
  }),
}) {}
