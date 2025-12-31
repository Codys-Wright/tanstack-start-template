import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint';
import * as HttpApiGroup from '@effect/platform/HttpApiGroup';
import * as Schema from 'effect/Schema';
import {
  Team,
  TeamMember,
  CreateTeamInput,
  UpdateTeamInput,
  RemoveTeamInput,
  AddTeamMemberInput,
  RemoveTeamMemberInput,
  SetActiveTeamInput,
  ListTeamMembersInput,
  TeamSuccessResponse,
  TeamError,
} from './schema.js';

/**
 * TeamApiGroup - HTTP API group for team management within organizations.
 * Matches Better Auth Organization Plugin team endpoints.
 *
 * This is composed into AuthApi.
 *
 * Endpoints (matching Better Auth):
 * - POST /team/create - Create a team
 * - GET /team/list - List all teams in organization
 * - POST /team/update - Update a team
 * - POST /team/remove - Remove a team
 * - POST /team/set-active - Set active team
 * - POST /team/add-member - Add member to team
 * - POST /team/remove-member - Remove member from team
 * - GET /team/list-members - List team members
 * - GET /team/list-user-teams - List teams for current user
 */
export class TeamApiGroup extends HttpApiGroup.make('team')
  // Create team
  .add(
    HttpApiEndpoint.post('create', '/create')
      .setPayload(CreateTeamInput)
      .addSuccess(Team)
      .addError(TeamError),
  )
  // List teams in organization
  .add(HttpApiEndpoint.get('list', '/list').addSuccess(Schema.Array(Team)).addError(TeamError))
  // Update team
  .add(
    HttpApiEndpoint.post('update', '/update')
      .setPayload(UpdateTeamInput)
      .addSuccess(Team)
      .addError(TeamError),
  )
  // Remove team
  .add(
    HttpApiEndpoint.post('remove', '/remove')
      .setPayload(RemoveTeamInput)
      .addSuccess(TeamSuccessResponse)
      .addError(TeamError),
  )
  // Set active team
  .add(
    HttpApiEndpoint.post('setActive', '/set-active')
      .setPayload(SetActiveTeamInput)
      .addSuccess(Schema.NullOr(Team))
      .addError(TeamError),
  )
  // Add team member
  .add(
    HttpApiEndpoint.post('addMember', '/add-member')
      .setPayload(AddTeamMemberInput)
      .addSuccess(TeamMember)
      .addError(TeamError),
  )
  // Remove team member
  .add(
    HttpApiEndpoint.post('removeMember', '/remove-member')
      .setPayload(RemoveTeamMemberInput)
      .addSuccess(TeamSuccessResponse)
      .addError(TeamError),
  )
  // List team members
  .add(
    HttpApiEndpoint.get('listMembers', '/list-members')
      .setUrlParams(ListTeamMembersInput)
      .addSuccess(Schema.Array(TeamMember))
      .addError(TeamError),
  )
  // List user's teams
  .add(
    HttpApiEndpoint.get('listUserTeams', '/list-user-teams')
      .addSuccess(Schema.Array(Team))
      .addError(TeamError),
  )
  .prefix('/team') {}
