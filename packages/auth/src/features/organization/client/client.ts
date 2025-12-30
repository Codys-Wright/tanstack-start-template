import * as Effect from 'effect/Effect';
import { authClient } from '../../session/client/client';

/**
 * OrganizationApi - Effect Service wrapper around Better Auth organization client
 *
 * Wraps Better Auth's organization plugin methods in Effect for:
 * - Type-safe error handling
 * - Integration with effect-atom state management
 * - Composable organization operations
 */
export class OrganizationApi extends Effect.Service<OrganizationApi>()(
  '@features/auth/OrganizationApi',
  {
    effect: Effect.sync(() => ({
      // ===== ORGANIZATION OPERATIONS =====

      listOrganizations: () =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.list();
            return result.data || [];
          },
          catch: (error) => new Error(`Failed to list organizations: ${error}`),
        }),

      createOrganization: (input: { name: string; slug?: string; logo?: string }) =>
        Effect.tryPromise({
          try: async () => {
            const createInput = {
              ...input,
              slug:
                input.slug ||
                input.name
                  .toLowerCase()
                  .replace(/[^a-z0-9]/g, '-')
                  .replace(/-+/g, '-')
                  .replace(/^-|-$/g, ''),
            };
            const result = await authClient.organization.create(createInput);
            if (result.error) {
              throw new Error(result.error.message || 'Failed to create organization');
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to create organization: ${
                error instanceof Error ? error.message : String(error)
              }`,
            ),
        }),

      updateOrganization: (
        organizationId: string,
        data: { name?: string; slug?: string; logo?: string | null },
      ) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.update({
              organizationId,
              data: {
                ...data,
                logo: data.logo || undefined,
              },
            });
            if (result.error) {
              throw new Error(result.error.message || 'Failed to update organization');
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to update organization: ${
                error instanceof Error ? error.message : String(error)
              }`,
            ),
        }),

      deleteOrganization: (organizationId: string) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.delete({
              organizationId,
            });
            if (result.error) {
              throw new Error(result.error.message || 'Failed to delete organization');
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to delete organization: ${
                error instanceof Error ? error.message : String(error)
              }`,
            ),
        }),

      setActiveOrganization: (organizationId: string | null) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.setActive({
              organizationId,
            });
            if (result.error) {
              throw new Error(result.error.message || 'Failed to switch organization');
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to switch organization: ${
                error instanceof Error ? error.message : String(error)
              }`,
            ),
        }),

      leaveOrganization: (organizationId: string) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.leave({
              organizationId,
            });
            if (result.error) {
              throw new Error(result.error.message || 'Failed to leave organization');
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to leave organization: ${
                error instanceof Error ? error.message : String(error)
              }`,
            ),
        }),

      // ===== MEMBER OPERATIONS =====

      listOrganizationMembers: (organizationId?: string) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.listMembers({
              query: { organizationId },
            });
            return result.data?.members || [];
          },
          catch: (error) =>
            new Error(
              `Failed to list organization members: ${
                error instanceof Error ? error.message : String(error)
              }`,
            ),
        }),

      inviteMember: (input: {
        email: string;
        role: 'owner' | 'admin' | 'member';
        organizationId?: string;
      }) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.inviteMember(input);
            if (result.error) {
              throw new Error(result.error.message || 'Failed to invite member');
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to invite member: ${error instanceof Error ? error.message : String(error)}`,
            ),
        }),

      updateMemberRole: (input: { memberId: string; role: string; organizationId?: string }) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.updateMemberRole(input);
            if (result.error) {
              throw new Error(result.error.message || 'Failed to update member role');
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to update member role: ${
                error instanceof Error ? error.message : String(error)
              }`,
            ),
        }),

      removeMember: (memberIdOrEmail: string, organizationId?: string) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.removeMember({
              memberIdOrEmail,
              organizationId,
            });
            if (result.error) {
              throw new Error(result.error.message || 'Failed to remove member');
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to remove member: ${error instanceof Error ? error.message : String(error)}`,
            ),
        }),

      // ===== INVITATION OPERATIONS =====

      listUserInvitations: () =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.listUserInvitations();
            return result.data || [];
          },
          catch: (error) => new Error(`Failed to list invitations: ${error}`),
        }),

      acceptInvitation: (invitationId: string) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.acceptInvitation({
              invitationId,
            });
            if (result.error) {
              throw new Error(result.error.message || 'Failed to accept invitation');
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to accept invitation: ${
                error instanceof Error ? error.message : String(error)
              }`,
            ),
        }),

      cancelInvitation: (invitationId: string) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.cancelInvitation({
              invitationId,
            });
            if (result.error) {
              throw new Error(result.error.message || 'Failed to cancel invitation');
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to cancel invitation: ${
                error instanceof Error ? error.message : String(error)
              }`,
            ),
        }),

      // ===== TEAM OPERATIONS =====

      listTeams: (organizationId?: string) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.listTeams({
              query: { organizationId },
            });
            return result.data || [];
          },
          catch: (error) => new Error(`Failed to list teams: ${error}`),
        }),

      listUserTeams: () =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.listUserTeams();
            return result.data || [];
          },
          catch: (error) => new Error(`Failed to list user teams: ${error}`),
        }),

      createTeam: (input: { organizationId: string; name: string }) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.createTeam({
              name: input.name,
              organizationId: input.organizationId,
            });
            if (result.error) {
              throw new Error(result.error.message || 'Failed to create team');
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to create team: ${error instanceof Error ? error.message : String(error)}`,
            ),
        }),

      updateTeam: (teamId: string, data: { name?: string }) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.updateTeam({
              teamId,
              data,
            });
            if (result.error) {
              throw new Error(result.error.message || 'Failed to update team');
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to update team: ${error instanceof Error ? error.message : String(error)}`,
            ),
        }),

      removeTeam: (teamId: string, organizationId?: string) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.removeTeam({
              teamId,
              organizationId,
            });
            if (result.error) {
              throw new Error(result.error.message || 'Failed to remove team');
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to remove team: ${error instanceof Error ? error.message : String(error)}`,
            ),
        }),

      // ===== TEAM MEMBER OPERATIONS =====

      listTeamMembers: (teamId: string) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.listTeamMembers({
              query: { teamId },
            });
            return result.data || [];
          },
          catch: (error) => new Error(`Failed to list team members: ${error}`),
        }),

      addTeamMember: (input: { teamId: string; userId: string; role?: string }) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.addTeamMember(input);
            if (result.error) {
              throw new Error(result.error.message || 'Failed to add team member');
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to add team member: ${
                error instanceof Error ? error.message : String(error)
              }`,
            ),
        }),

      removeTeamMember: (teamId: string, userId: string) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.removeTeamMember({
              teamId,
              userId,
            });
            if (result.error) {
              throw new Error(result.error.message || 'Failed to remove team member');
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to remove team member: ${
                error instanceof Error ? error.message : String(error)
              }`,
            ),
        }),

      // ===== ADDITIONAL OPERATIONS =====

      setActiveTeam: (teamId: string | null) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.setActiveTeam({
              teamId,
            });
            if (result.error) {
              throw new Error(result.error.message || 'Failed to set active team');
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to set active team: ${
                error instanceof Error ? error.message : String(error)
              }`,
            ),
        }),
    })),
  },
) {}
