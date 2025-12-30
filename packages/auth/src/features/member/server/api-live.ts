import * as HttpApiBuilder from '@effect/platform/HttpApiBuilder';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { AuthApi } from '@auth/core/auth-api';
import { MemberService } from './service';
import { InviteMemberInput, InvalidRoleError, Member, MemberNotFound, MemberWithFullDetails, MemberWithUser, MemberId, RemoveMemberInput, UpdateMemberRoleInput } from '@auth/features/member/domain/schema';

/**
 * MemberApiLive - HTTP API handlers for member group.
 */
export const MemberApiLive = HttpApiBuilder.group(AuthApi, 'members', (handlers) =>
  handlers
    .handle('listMembers', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Member API] Listing members');
        const member = yield* MemberService;
        return yield* member.listMembers();
      }),
    )
    .handle('getMember', ({ path }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Member API] Getting member', path.memberId);
        const member = yield* MemberService;
        return yield* member.getMember(path.memberId);
      }),
    )
    .handle('inviteMember', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Member API] Inviting member', payload.email);
        const member = yield* MemberService;
        const invited = yield* member.inviteMember(payload);
        return { member: invited };
      }),
    )
    .handle('updateMemberRole', ({ path, payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Member API] Updating member role', path.memberId);
        const member = yield* MemberService;
        const result = yield* member.updateMemberRole(payload);
        return { result };
      }),
    )
    .handle('removeMember', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Member API] Removing member', payload.memberIdOrEmail);
        const member = yield* MemberService;
        const result = yield* member.removeMember(payload);
        return { result };
      }),
    ).pipe(Layer.provide(MemberService.Default));
