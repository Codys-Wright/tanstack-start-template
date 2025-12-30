/**
 * Team atoms - Re-exports team-related atoms from organization feature
 *
 * Team management in Better Auth is part of the organization plugin,
 * so the actual atoms live in the organization feature. This file
 * provides a convenient re-export for the team feature.
 */

export {
  // Team list atoms
  teamsAtom,
  userTeamsAtom,
  // Team CRUD atoms
  createTeamAtom,
  updateTeamAtom,
  removeTeamAtom,
  // Team member atoms
  teamMembersAtom,
  addTeamMemberAtom,
  removeTeamMemberAtom,
  // Active team
  setActiveTeamAtom,
} from '@auth/features/organization/client/atoms';
