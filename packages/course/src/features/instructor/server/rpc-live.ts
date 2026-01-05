import { AuthContext } from '@auth/server';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { InstructorRpc } from '../domain/index.js';
import { InstructorService } from './service.js';

export const InstructorRpcLive = InstructorRpc.toLayer(
  Effect.gen(function* () {
    const instructors = yield* InstructorService;

    return InstructorRpc.of({
      instructor_list: Effect.fn('InstructorRpc.list')(function* () {
        yield* Effect.log('[RPC] Listing all instructors');
        return yield* instructors.list();
      }),

      instructor_listApproved: Effect.fn('InstructorRpc.listApproved')(function* () {
        yield* Effect.log('[RPC] Listing approved instructors');
        return yield* instructors.listApproved();
      }),

      instructor_getById: Effect.fn('InstructorRpc.getById')(function* ({ id }) {
        yield* Effect.log(`[RPC] Getting instructor by id: ${id}`);
        return yield* instructors.getById(id);
      }),

      instructor_getByUserId: Effect.fn('InstructorRpc.getByUserId')(function* ({ userId }) {
        yield* Effect.log(`[RPC] Getting instructor by userId: ${userId}`);
        return yield* instructors.getByUserId(userId);
      }),

      instructor_getMyProfile: Effect.fn('InstructorRpc.getMyProfile')(function* () {
        const auth = yield* AuthContext;
        yield* Effect.log(`[RPC] Getting instructor profile for user: ${auth.userId}`);
        return yield* instructors.getByUserId(auth.userId);
      }),

      instructor_apply: Effect.fn('InstructorRpc.apply')(function* ({ input }) {
        yield* Effect.log(`[RPC] Instructor application: ${input.displayName}`);
        return yield* instructors.apply(input);
      }),

      instructor_update: Effect.fn('InstructorRpc.update')(function* ({ id, input }) {
        yield* Effect.log(`[RPC] Updating instructor: ${id}`);
        return yield* instructors.update(id, input);
      }),

      instructor_approve: Effect.fn('InstructorRpc.approve')(function* ({ id }) {
        yield* Effect.log(`[RPC] Approving instructor: ${id}`);
        return yield* instructors.approve(id);
      }),

      instructor_suspend: Effect.fn('InstructorRpc.suspend')(function* ({ id }) {
        yield* Effect.log(`[RPC] Suspending instructor: ${id}`);
        return yield* instructors.suspend(id);
      }),
    });
  }),
).pipe(Layer.provide(InstructorService.Default));
