import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint';
import * as HttpApiGroup from '@effect/platform/HttpApiGroup';
import * as Schema from 'effect/Schema';
import {
  InviteMemberInput,
  Member,
  MemberWithUser,
  UpdateMemberRoleInput,
  RemoveMemberInput,
  MemberSuccessResponse,
  MemberError,
} from './schema.js';

/**
 * MemberApiGroup - HTTP API group for organization member management.
 * Matches Better Auth Organization Plugin member endpoints.
 *
 * This is composed into AuthApi.
 *
 * Endpoints (matching Better Auth):
 * - GET /member/list - List members in organization
 * - POST /member/invite - Invite a member to organization
 * - POST /member/update-role - Update member's role
 * - POST /member/remove - Remove a member from organization
 */
export class MemberApiGroup extends HttpApiGroup.make('member')
  // List members
  .add(
    HttpApiEndpoint.get('list', '/list')
      .addSuccess(Schema.Array(MemberWithUser))
      .addError(MemberError),
  )
  // Invite member
  .add(
    HttpApiEndpoint.post('invite', '/invite')
      .setPayload(InviteMemberInput)
      .addSuccess(Member)
      .addError(MemberError),
  )
  // Update member role
  .add(
    HttpApiEndpoint.post('updateRole', '/update-role')
      .setPayload(UpdateMemberRoleInput)
      .addSuccess(Member)
      .addError(MemberError),
  )
  // Remove member
  .add(
    HttpApiEndpoint.post('remove', '/remove')
      .setPayload(RemoveMemberInput)
      .addSuccess(MemberSuccessResponse)
      .addError(MemberError),
  )
  .prefix('/member') {}
