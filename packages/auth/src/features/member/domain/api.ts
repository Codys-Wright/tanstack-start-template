import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint';
import * as HttpApiGroup from '@effect/platform/HttpApiGroup';
import * as Schema from 'effect/Schema';
import { AuthError } from '../session/domain/schema.js';
import {
  OrganizationRole,
  InviteMemberInput,
  InvalidRoleError,
  Member,
  MemberNotFound,
  MemberWithFullDetails,
  MemberWithUser,
  MemberId,
  RemoveMemberInput,
  UpdateMemberRoleInput,
} from './schema.js';

export class MemberApiGroup extends HttpApiGroup.make('members')
  .add(
    HttpApiEndpoint.get('listMembers', '/')
      .addSuccess(Schema.Struct({ members: Schema.Array(MemberWithUser) }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.get('getMember', '/:memberId')
      .addSuccess(MemberWithFullDetails)
      .addError(MemberNotFound),
  )
  .add(
    HttpApiEndpoint.post('inviteMember', '/invite')
      .setPayload(InviteMemberInput)
      .addSuccess(Schema.Struct({ member: Member }))
      .addError(InvalidRoleError),
  )
  .add(
    HttpApiEndpoint.patch('updateMemberRole', '/:memberId/role')
      .setPayload(UpdateMemberRoleInput)
      .addSuccess(Schema.Struct({ success: Schema.Boolean }))
      .addError(InvalidRoleError),
  )
  .add(
    HttpApiEndpoint.del('removeMember', '/:memberId')
      .setPayload(Schema.Struct({ memberIdOrEmail: Schema.String }))
      .addSuccess(Schema.Struct({ success: Schema.Boolean }))
      .addError(MemberNotFound),
  )
  .prefix('/members') {}
