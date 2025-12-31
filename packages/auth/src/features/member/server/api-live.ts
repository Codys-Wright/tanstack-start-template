import * as HttpApiBuilder from '@effect/platform/HttpApiBuilder';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { AuthApi } from '@auth/core/auth-api';
import { MemberService } from '@auth/features/member/server/service';
import { MemberError, type Member, type MemberWithUser } from '@auth/features/member/domain/schema';

/**
 * MemberApiLive - HTTP API handlers for member group.
 *
 * Implements Better Auth organization plugin member endpoints:
 * - list, invite, updateRole, remove
 *
 * Note: We use type assertions because Better Auth's runtime response types
 * are not fully typed, but the data matches our schemas at runtime.
 */
export const MemberApiLive = HttpApiBuilder.group(AuthApi, 'member', (handlers) =>
  handlers
    .handle('list', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Member API] Listing members');
        const member = yield* MemberService;
        const result = yield* member.list();
        return result as readonly MemberWithUser[];
      }).pipe(Effect.mapError((e) => new MemberError({ message: String(e) }))),
    )
    .handle('invite', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Member API] Inviting member', payload.email);
        const member = yield* MemberService;
        const result = yield* member.invite({
          email: payload.email,
          role: payload.role,
          organizationId: payload.organizationId,
          resend: payload.resend,
          teamId: payload.teamId,
        });
        return result as Member;
      }).pipe(Effect.mapError((e) => new MemberError({ message: String(e) }))),
    )
    .handle('updateRole', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Member API] Updating member role', payload.memberId);
        const member = yield* MemberService;
        const result = yield* member.updateRole({
          memberId: payload.memberId,
          role: payload.role,
          organizationId: payload.organizationId,
        });
        return result as Member;
      }).pipe(Effect.mapError((e) => new MemberError({ message: String(e) }))),
    )
    .handle('remove', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Member API] Removing member', payload.memberIdOrEmail);
        const member = yield* MemberService;
        yield* member.remove({
          memberIdOrEmail: payload.memberIdOrEmail,
          organizationId: payload.organizationId,
        });
        return { success: true as const };
      }).pipe(Effect.mapError((e) => new MemberError({ message: String(e) }))),
    ),
).pipe(Layer.provide(MemberService.Default));
