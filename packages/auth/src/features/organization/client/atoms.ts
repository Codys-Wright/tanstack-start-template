import { Atom, Result } from '@effect-atom/atom-react';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import { OrganizationApi } from './client.js';

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
    }),
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
            result.value.map((org: any) => (org.id === organizationId ? { ...org, ...data } : org)),
          Remove: ({ organizationId }) =>
            result.value.filter((org: any) => org.id !== organizationId),
        });

        ctx.setSelf(Result.success(updated));
      },
    ),
    { remote: remoteAtom, Action },
  );
})();

/**
 * createOrganizationAtom - Create a new organization
 */
export const createOrganizationAtom = orgRuntime.fn<{
  name: string;
  slug?: string;
  logo?: string;
}>()(
  Effect.fnUntraced(function* (input, get) {
    const api = yield* OrganizationApi;
    const organization = yield* api.createOrganization(input);

    // Optimistically add to organizations list
    get.set(organizationsAtom, organizationsAtom.Action.Add({ organization }));

    return organization;
  }),
);

/**
 * updateOrganizationAtom - Update an organization
 */
export const updateOrganizationAtom = orgRuntime.fn<{
  organizationId: string;
  data: { name?: string; slug?: string; logo?: string | null };
}>()(
  Effect.fnUntraced(function* (input, get) {
    const api = yield* OrganizationApi;
    const organization = yield* api.updateOrganization(input.organizationId, input.data);

    // Optimistically update in organizations list
    get.set(
      organizationsAtom,
      organizationsAtom.Action.Update({
        organizationId: input.organizationId,
        data: input.data,
      }),
    );

    return organization;
  }),
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
      organizationsAtom.Action.Remove({ organizationId: input.organizationId }),
    );

    return result;
  }),
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
  }),
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
      organizationsAtom.Action.Remove({ organizationId: input.organizationId }),
    );

    return result;
  }),
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
    }),
  );

// ===== MEMBER ATOMS =====

/**
 * inviteMemberAtom - Invite a member to organization
 */
export const inviteMemberAtom = orgRuntime.fn<{
  email: string;
  role: 'owner' | 'admin' | 'member';
  organizationId?: string;
}>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* OrganizationApi;
    return yield* api.inviteMember(input);
  }),
);

/**
 * updateMemberRoleAtom - Update member role
 */
export const updateMemberRoleAtom = orgRuntime.fn<{
  memberId: string;
  role: string;
  organizationId?: string;
}>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* OrganizationApi;
    return yield* api.updateMemberRole(input);
  }),
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
  }),
);

// ===== INVITATION ATOMS =====

/**
 * invitationsAtom - List of user's invitations
 */
export const invitationsAtom = orgRuntime.atom(
  Effect.gen(function* () {
    const api = yield* OrganizationApi;
    return yield* api.listUserInvitations();
  }),
);

/**
 * acceptInvitationAtom - Accept an organization invitation
 */
export const acceptInvitationAtom = orgRuntime.fn<{ invitationId: string }>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* OrganizationApi;
    return yield* api.acceptInvitation(input.invitationId);
  }),
);

/**
 * cancelInvitationAtom - Cancel an organization invitation
 */
export const cancelInvitationAtom = orgRuntime.fn<{ invitationId: string }>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* OrganizationApi;
    return yield* api.cancelInvitation(input.invitationId);
  }),
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
    }),
  );

/**
 * userTeamsAtom - List of user's teams across all organizations
 */
export const userTeamsAtom = orgRuntime.atom(
  Effect.gen(function* () {
    const api = yield* OrganizationApi;
    return yield* api.listUserTeams();
  }),
);

/**
 * createTeamAtom - Create a new team
 */
export const createTeamAtom = orgRuntime.fn<{
  organizationId: string;
  name: string;
}>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* OrganizationApi;
    return yield* api.createTeam(input);
  }),
);

/**
 * updateTeamAtom - Update a team
 */
export const updateTeamAtom = orgRuntime.fn<{
  teamId: string;
  data: { name?: string };
}>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* OrganizationApi;
    return yield* api.updateTeam(input.teamId, input.data);
  }),
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
  }),
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
    }),
  );

/**
 * addTeamMemberAtom - Add a member to a team
 */
export const addTeamMemberAtom = orgRuntime.fn<{
  teamId: string;
  userId: string;
  role?: string;
}>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* OrganizationApi;
    return yield* api.addTeamMember(input);
  }),
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
  }),
);

// ===== ADDITIONAL ATOMS =====

/**
 * setActiveTeamAtom - Set the active team for the current session
 */
export const setActiveTeamAtom = orgRuntime.fn<{ teamId: string | null }>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* OrganizationApi;
    return yield* api.setActiveTeam(input.teamId);
  }),
);
