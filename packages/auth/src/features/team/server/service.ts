import * as Effect from 'effect/Effect';
import { AuthService } from '@auth/core/server/service';

/**
 * Team Service - Wraps Better Auth team operations in Effect
 *
 * Uses auth.api.* methods for team operations.
 * The organization plugin exposes team methods like:
 * - createTeam, listTeams, updateTeam, removeTeam
 * - setActiveTeam, addTeamMember, removeTeamMember
 * - listTeamMembers, listUserTeams
 *
 * Note: We use type assertion (as any) because Better Auth's TypeScript types
 * don't fully expose plugin-added methods, but they exist at runtime.
 */
export class TeamService extends Effect.Service<TeamService>()('TeamService', {
  dependencies: [AuthService.Default],
  effect: Effect.gen(function* () {
    const auth = yield* AuthService;
    // Type assertion needed because Better Auth types don't fully expose plugin methods
    const api = auth.api as any;

    return {
      /**
       * Create a team
       */
      create: (input: { name: string; organizationId?: string | null }) =>
        Effect.tryPromise({
          try: () => api.createTeam({ body: input }),
          catch: (error) => new Error(`Failed to create team: ${error}`),
        }),

      /**
       * List all teams in organization
       */
      list: () =>
        Effect.tryPromise({
          try: () => api.listTeams({}),
          catch: (error) => new Error(`Failed to list teams: ${error}`),
        }),

      /**
       * Update a team
       */
      update: (input: { teamId: string; data: { name?: string | null } }) =>
        Effect.tryPromise({
          try: () => api.updateTeam({ body: input }),
          catch: (error) => new Error(`Failed to update team: ${error}`),
        }),

      /**
       * Remove a team
       */
      remove: (input: { teamId: string; organizationId?: string | null }) =>
        Effect.tryPromise({
          try: () => api.removeTeam({ body: input }),
          catch: (error) => new Error(`Failed to remove team: ${error}`),
        }),

      /**
       * Set active team
       */
      setActive: (input: { teamId: string | null }) =>
        Effect.tryPromise({
          try: () => api.setActiveTeam({ body: input }),
          catch: (error) => new Error(`Failed to set active team: ${error}`),
        }),

      /**
       * Add member to team
       */
      addMember: (input: { teamId: string; userId: string; role?: string }) =>
        Effect.tryPromise({
          try: () => api.addTeamMember({ body: input }),
          catch: (error) => new Error(`Failed to add team member: ${error}`),
        }),

      /**
       * Remove member from team
       */
      removeMember: (input: { teamId: string; userId: string }) =>
        Effect.tryPromise({
          try: () => api.removeTeamMember({ body: input }),
          catch: (error) => new Error(`Failed to remove team member: ${error}`),
        }),

      /**
       * List team members
       */
      listMembers: (input: { teamId: string }) =>
        Effect.tryPromise({
          try: () => api.listTeamMembers({ query: input }),
          catch: (error) => new Error(`Failed to list team members: ${error}`),
        }),

      /**
       * List user's teams
       */
      listUserTeams: () =>
        Effect.tryPromise({
          try: () => api.listUserTeams({}),
          catch: (error) => new Error(`Failed to list user teams: ${error}`),
        }),
    };
  }),
}) {}
