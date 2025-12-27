import { Atom, Result } from "@effect-atom/atom-react";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import { authClient } from "../auth.client.js";

/**
 * OrganizationApi - Effect Service wrapper around Better Auth organization client
 *
 * Wraps Better Auth's organization plugin methods in Effect for:
 * - Type-safe error handling
 * - Integration with effect-atom state management
 * - Composable organization operations
 */
class OrganizationApi extends Effect.Service<OrganizationApi>()(
  "@features/auth/OrganizationApi",
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

      createOrganization: (input: any) =>
        Effect.tryPromise({
          try: async () => {
            const createInput = {
              ...input,
              slug:
                input.slug ||
                input.name
                  .toLowerCase()
                  .replace(/[^a-z0-9]/g, "-")
                  .replace(/-+/g, "-")
                  .replace(/^-|-$/g, ""),
            };
            const result = await authClient.organization.create(createInput);
            if (result.error) {
              throw new Error(
                result.error.message || "Failed to create organization"
              );
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to create organization: ${
                error instanceof Error ? error.message : String(error)
              }`
            ),
        }),

      updateOrganization: (organizationId: string, data: any) =>
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
              throw new Error(
                result.error.message || "Failed to update organization"
              );
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to update organization: ${
                error instanceof Error ? error.message : String(error)
              }`
            ),
        }),

      deleteOrganization: (organizationId: string) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.delete({
              organizationId,
            });
            if (result.error) {
              throw new Error(
                result.error.message || "Failed to delete organization"
              );
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to delete organization: ${
                error instanceof Error ? error.message : String(error)
              }`
            ),
        }),

      setActiveOrganization: (organizationId: string | null) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.setActive({
              organizationId,
            });
            if (result.error) {
              throw new Error(
                result.error.message || "Failed to switch organization"
              );
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to switch organization: ${
                error instanceof Error ? error.message : String(error)
              }`
            ),
        }),

      leaveOrganization: (organizationId: string) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.leave({
              organizationId,
            });
            if (result.error) {
              throw new Error(
                result.error.message || "Failed to leave organization"
              );
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to leave organization: ${
                error instanceof Error ? error.message : String(error)
              }`
            ),
        }),

      // ===== MEMBER OPERATIONS =====

      inviteMember: (input: any) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.inviteMember(input);
            if (result.error) {
              throw new Error(
                result.error.message || "Failed to invite member"
              );
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to invite member: ${
                error instanceof Error ? error.message : String(error)
              }`
            ),
        }),

      updateMemberRole: (input: any) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.updateMemberRole(
              input
            );
            if (result.error) {
              throw new Error(
                result.error.message || "Failed to update member role"
              );
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to update member role: ${
                error instanceof Error ? error.message : String(error)
              }`
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
              throw new Error(
                result.error.message || "Failed to remove member"
              );
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to remove member: ${
                error instanceof Error ? error.message : String(error)
              }`
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
              throw new Error(
                result.error.message || "Failed to accept invitation"
              );
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to accept invitation: ${
                error instanceof Error ? error.message : String(error)
              }`
            ),
        }),

      cancelInvitation: (invitationId: string) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.cancelInvitation({
              invitationId,
            });
            if (result.error) {
              throw new Error(
                result.error.message || "Failed to cancel invitation"
              );
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to cancel invitation: ${
                error instanceof Error ? error.message : String(error)
              }`
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

      createTeam: (input: any) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.createTeam(input);
            if (result.error) {
              throw new Error(result.error.message || "Failed to create team");
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to create team: ${
                error instanceof Error ? error.message : String(error)
              }`
            ),
        }),

      updateTeam: (teamId: string, data: any) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.updateTeam({
              teamId,
              data,
            });
            if (result.error) {
              throw new Error(result.error.message || "Failed to update team");
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to update team: ${
                error instanceof Error ? error.message : String(error)
              }`
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
              throw new Error(result.error.message || "Failed to remove team");
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to remove team: ${
                error instanceof Error ? error.message : String(error)
              }`
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

      addTeamMember: (input: any) =>
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.organization.addTeamMember(input);
            if (result.error) {
              throw new Error(
                result.error.message || "Failed to add team member"
              );
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to add team member: ${
                error instanceof Error ? error.message : String(error)
              }`
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
              throw new Error(
                result.error.message || "Failed to remove team member"
              );
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to remove team member: ${
                error instanceof Error ? error.message : String(error)
              }`
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
              throw new Error(
                result.error.message || "Failed to set active team"
              );
            }
            return result.data;
          },
          catch: (error) =>
            new Error(
              `Failed to set active team: ${
                error instanceof Error ? error.message : String(error)
              }`
            ),
        }),

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
              }`
            ),
        }),
    })),
  }
) {}

/**
 * Runtime for organization atoms - provides OrganizationApi service
 */
export const orgRuntime = Atom.runtime(OrganizationApi.Default);

// ===== ORGANIZATION ATOMS =====

/**
 * organizationsAtom - List of user's organizations
 */
export const organizationsAtom = (() => {
  const remoteAtom = orgRuntime.atom(
    Effect.gen(function* () {
      const api = yield* OrganizationApi;
      return yield* api.listOrganizations();
    })
  );

  type Action = Data.TaggedEnum<{
    Add: { readonly organization: any };
    Update: { readonly organizationId: string; readonly data: Partial<any> };
    Remove: { readonly organizationId: string };
  }>;
  const Action = Data.taggedEnum<Action>();

  return Object.assign(
    Atom.writable(
      (get) => get(remoteAtom),
      (ctx, action: Action) => {
        const result = ctx.get(organizationsAtom);
        if (!Result.isSuccess(result)) return;

        const updated = Action.$match(action, {
          Add: ({ organization }) => [organization, ...result.value],
          Update: ({ organizationId, data }) =>
            result.value.map((org: any) =>
              org.id === organizationId ? { ...org, ...data } : org
            ),
          Remove: ({ organizationId }) =>
            result.value.filter((org: any) => org.id !== organizationId),
        });

        ctx.setSelf(Result.success(updated));
      }
    ),
    { remote: remoteAtom, Action }
  );
})();

/**
 * createOrganizationAtom - Create a new organization
 */
export const createOrganizationAtom = orgRuntime.fn<any>()(
  Effect.fnUntraced(function* (input, get) {
    const api = yield* OrganizationApi;
    const organization = yield* api.createOrganization(input);

    // Optimistically add to organizations list
    get.set(organizationsAtom, organizationsAtom.Action.Add({ organization }));

    return organization;
  })
);

/**
 * updateOrganizationAtom - Update an organization
 */
export const updateOrganizationAtom = orgRuntime.fn<{
  organizationId: string;
  data: any;
}>()(
  Effect.fnUntraced(function* (input, get) {
    const api = yield* OrganizationApi;
    const organization = yield* api.updateOrganization(
      input.organizationId,
      input.data
    );

    // Optimistically update in organizations list
    get.set(
      organizationsAtom,
      organizationsAtom.Action.Update({
        organizationId: input.organizationId,
        data: input.data,
      })
    );

    return organization;
  })
);

/**
 * deleteOrganizationAtom - Delete an organization
 */
export const deleteOrganizationAtom = orgRuntime.fn<{
  organizationId: string;
}>()(
  Effect.fnUntraced(function* (input, get) {
    const api = yield* OrganizationApi;
    const result = yield* api.deleteOrganization(input.organizationId);

    // Optimistically remove from organizations list
    get.set(
      organizationsAtom,
      organizationsAtom.Action.Remove({ organizationId: input.organizationId })
    );

    return result;
  })
);

/**
 * setActiveOrganizationAtom - Switch active organization
 */
export const setActiveOrganizationAtom = orgRuntime.fn<{
  organizationId: string | null;
}>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* OrganizationApi;
    return yield* api.setActiveOrganization(input.organizationId);
  })
);

/**
 * leaveOrganizationAtom - Leave an organization
 */
export const leaveOrganizationAtom = orgRuntime.fn<{
  organizationId: string;
}>()(
  Effect.fnUntraced(function* (input, get) {
    const api = yield* OrganizationApi;
    const result = yield* api.leaveOrganization(input.organizationId);

    // Optimistically remove from organizations list
    get.set(
      organizationsAtom,
      organizationsAtom.Action.Remove({ organizationId: input.organizationId })
    );

    return result;
  })
);

// ===== MEMBER ATOMS =====

/**
 * inviteMemberAtom - Invite a member to organization
 */
export const inviteMemberAtom = orgRuntime.fn<any>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* OrganizationApi;
    return yield* api.inviteMember(input);
  })
);

/**
 * updateMemberRoleAtom - Update member role
 */
export const updateMemberRoleAtom = orgRuntime.fn<any>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* OrganizationApi;
    return yield* api.updateMemberRole(input);
  })
);

/**
 * removeMemberAtom - Remove a member from organization
 */
export const removeMemberAtom = orgRuntime.fn<{
  memberIdOrEmail: string;
  organizationId?: string;
}>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* OrganizationApi;
    return yield* api.removeMember(input.memberIdOrEmail, input.organizationId);
  })
);

// ===== INVITATION ATOMS =====

/**
 * invitationsAtom - List of user's invitations
 */
export const invitationsAtom = orgRuntime.atom(
  Effect.gen(function* () {
    const api = yield* OrganizationApi;
    return yield* api.listUserInvitations();
  })
);

/**
 * acceptInvitationAtom - Accept an organization invitation
 */
export const acceptInvitationAtom = orgRuntime.fn<{ invitationId: string }>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* OrganizationApi;
    return yield* api.acceptInvitation(input.invitationId);
  })
);

/**
 * cancelInvitationAtom - Cancel an organization invitation
 */
export const cancelInvitationAtom = orgRuntime.fn<{ invitationId: string }>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* OrganizationApi;
    return yield* api.cancelInvitation(input.invitationId);
  })
);

// ===== TEAM ATOMS =====

/**
 * teamsAtom - List of teams (optionally filtered by organization)
 */
export const teamsAtom = (organizationId?: string) =>
  orgRuntime.atom(
    Effect.gen(function* () {
      const api = yield* OrganizationApi;
      return yield* api.listTeams(organizationId);
    })
  );

/**
 * userTeamsAtom - List of user's teams across all organizations
 */
export const userTeamsAtom = orgRuntime.atom(
  Effect.gen(function* () {
    const api = yield* OrganizationApi;
    return yield* api.listUserTeams();
  })
);

/**
 * createTeamAtom - Create a new team
 */
export const createTeamAtom = orgRuntime.fn<any>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* OrganizationApi;
    return yield* api.createTeam(input);
  })
);

/**
 * updateTeamAtom - Update a team
 */
export const updateTeamAtom = orgRuntime.fn<{ teamId: string; data: any }>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* OrganizationApi;
    return yield* api.updateTeam(input.teamId, input.data);
  })
);

/**
 * removeTeamAtom - Remove a team
 */
export const removeTeamAtom = orgRuntime.fn<{
  teamId: string;
  organizationId?: string;
}>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* OrganizationApi;
    return yield* api.removeTeam(input.teamId, input.organizationId);
  })
);

// ===== TEAM MEMBER ATOMS =====

/**
 * teamMembersAtom - List of team members
 */
export const teamMembersAtom = (teamId: string) =>
  orgRuntime.atom(
    Effect.gen(function* () {
      const api = yield* OrganizationApi;
      return yield* api.listTeamMembers(teamId);
    })
  );

/**
 * addTeamMemberAtom - Add a member to a team
 */
export const addTeamMemberAtom = orgRuntime.fn<any>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* OrganizationApi;
    return yield* api.addTeamMember(input);
  })
);

/**
 * removeTeamMemberAtom - Remove a member from a team
 */
export const removeTeamMemberAtom = orgRuntime.fn<{
  teamId: string;
  userId: string;
}>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* OrganizationApi;
    return yield* api.removeTeamMember(input.teamId, input.userId);
  })
);

// ===== ADDITIONAL ATOMS =====

/**
 * setActiveTeamAtom - Set the active team for the current session
 */
export const setActiveTeamAtom = orgRuntime.fn<{ teamId: string | null }>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* OrganizationApi;
    return yield* api.setActiveTeam(input.teamId);
  })
);

/**
 * organizationMembersAtom - List members of an organization
 * Factory function that creates an atom for a specific organization
 */
export const organizationMembersAtom = (organizationId?: string) =>
  orgRuntime.atom(
    Effect.gen(function* () {
      const api = yield* OrganizationApi;
      return yield* api.listOrganizationMembers(organizationId);
    })
  );
