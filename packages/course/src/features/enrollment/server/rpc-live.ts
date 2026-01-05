import { AuthContext } from '@auth/server';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { EnrollmentRpc } from '../domain/index.js';
import { EnrollmentService } from './service.js';

export const EnrollmentRpcLive = EnrollmentRpc.toLayer(
  Effect.gen(function* () {
    const enrollments = yield* EnrollmentService;

    return EnrollmentRpc.of({
      enrollment_getById: Effect.fn('EnrollmentRpc.getById')(function* ({ id }) {
        yield* Effect.log(`[RPC] Getting enrollment by id: ${id}`);
        return yield* enrollments.getById(id);
      }),

      enrollment_getByUserAndCourse: Effect.fn('EnrollmentRpc.getByUserAndCourse')(function* ({
        userId,
        courseId,
      }) {
        yield* Effect.log(`[RPC] Getting enrollment for user: ${userId}, course: ${courseId}`);
        return yield* enrollments.getByUserAndCourse(userId, courseId);
      }),

      enrollment_listByUser: Effect.fn('EnrollmentRpc.listByUser')(function* ({ userId }) {
        yield* Effect.log(`[RPC] Listing enrollments for user: ${userId}`);
        return yield* enrollments.listByUser(userId);
      }),

      enrollment_listByCourse: Effect.fn('EnrollmentRpc.listByCourse')(function* ({ courseId }) {
        yield* Effect.log(`[RPC] Listing enrollments for course: ${courseId}`);
        return yield* enrollments.listByCourse(courseId);
      }),

      enrollment_listActiveByUser: Effect.fn('EnrollmentRpc.listActiveByUser')(function* ({
        userId,
      }) {
        yield* Effect.log(`[RPC] Listing active enrollments for user: ${userId}`);
        return yield* enrollments.listActiveByUser(userId);
      }),

      enrollment_listMyEnrollments: Effect.fn('EnrollmentRpc.listMyEnrollments')(function* () {
        const auth = yield* AuthContext;
        yield* Effect.log(`[RPC] Listing my enrollments: ${auth.userId}`);
        return yield* enrollments.listByUser(auth.userId);
      }),

      enrollment_isEnrolled: Effect.fn('EnrollmentRpc.isEnrolled')(function* ({ courseId }) {
        const auth = yield* AuthContext;
        yield* Effect.log(`[RPC] Checking enrollment for course: ${courseId}`);
        return yield* enrollments.isEnrolled(auth.userId, courseId);
      }),

      enrollment_enroll: Effect.fn('EnrollmentRpc.enroll')(function* ({ input }) {
        yield* Effect.log(`[RPC] Enrolling in course: ${input.courseId}`);
        return yield* enrollments.enroll(input);
      }),

      enrollment_update: Effect.fn('EnrollmentRpc.update')(function* ({ id, input }) {
        yield* Effect.log(`[RPC] Updating enrollment: ${id}`);
        return yield* enrollments.update(id, input);
      }),

      enrollment_markCompleted: Effect.fn('EnrollmentRpc.markCompleted')(function* ({ id }) {
        yield* Effect.log(`[RPC] Marking enrollment completed: ${id}`);
        return yield* enrollments.markCompleted(id);
      }),

      enrollment_cancel: Effect.fn('EnrollmentRpc.cancel')(function* ({ id }) {
        yield* Effect.log(`[RPC] Canceling enrollment: ${id}`);
        return yield* enrollments.cancel(id);
      }),
    });
  }),
).pipe(Layer.provide(EnrollmentService.Default));
