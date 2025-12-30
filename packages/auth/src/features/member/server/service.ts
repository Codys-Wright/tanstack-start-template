import * as Effect from 'effect/Effect';
import { AuthService } from '../../../../core/server/service';

/**
 * Member Service - Wraps organization member operations in Effect
 *
 * Uses organization client methods for:
 * - List members
 * - Invite members
 * - Update member roles
 * - Remove members
 */
export class MemberService extends Effect.Service<MemberService>()('MemberService', {
  dependencies: [AuthService.Default],
  effect: Effect.gen(function* () {
    const auth = yield* AuthService;
    const organizationClient = auth.api.organization;

    return {
      /**
       * List members of an organization
       */
      listMembers: (organizationId?: string) =>
        Effect.tryPromise({
          try: () =>
            organizationClient.listMembers({
              query: organizationId ? { organizationId } : {},
            }),
          catch: (error) => new Error(`Failed to list members: ${error}`),
        }),

      /**
       * Get a specific member
       */
      getMember: (memberId: string) =>
        Effect.tryPromise({
          try: () => organizationClient.getMember({ query: { memberId } }),
          catch: (error) => new Error(`Failed to get member: ${error}`),
        }),

      /**
       * Invite a member to organization
       */
      inviteMember: (input: { email: string; role: string; organizationId?: string }) =>
        Effect.tryPromise({
          try: () => organizationClient.invite({ body: input }),
          catch: (error) => new Error(`Failed to invite member: ${error}`),
        }),

      /**
       * Update member role
       */
      updateMemberRole: (input: { memberId: string; role: string; organizationId?: string }) =>
        Effect.tryPromise({
          try: () =>
            organizationClient.updateMemberRole({
              params: { memberId: input.memberId },
              body: {
                role: input.role,
                organizationId: input.organizationId,
              },
            }),
          catch: (error) => new Error(`Failed to update member role: ${error}`),
        }),

      /**
       * Remove a member from organization
       */
      removeMember: (input: { memberIdOrEmail: string; organizationId?: string }) =>
        Effect.tryPromise({
          try: () =>
            organizationClient.removeMember({
              body: {
                memberIdOrEmail: input.memberIdOrEmail,
                organizationId: input.organizationId,
              },
            }),
          catch: (error) => new Error(`Failed to remove member: ${error}`),
        }),
    };
  }),
}) {}
