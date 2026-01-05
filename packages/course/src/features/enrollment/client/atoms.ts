import { serializable } from '@core/client/atom-utils';
import { Result } from '@effect-atom/atom-react';
import * as RpcClientError from '@effect/rpc/RpcClientError';
import * as Effect from 'effect/Effect';
import * as S from 'effect/Schema';
import { CourseId } from '../../course/domain/schema.js';
import { CreateEnrollmentInput, Enrollment } from '../domain/index.js';
import { EnrollmentClient } from './client.js';

const EnrollmentsSchema = S.Array(Enrollment);

// ============================================================================
// Query Atoms
// ============================================================================

/**
 * Current user's enrollments
 */
export const myEnrollmentsAtom = EnrollmentClient.runtime
  .atom(
    Effect.gen(function* () {
      const client = yield* EnrollmentClient;
      return yield* client('enrollment_listMyEnrollments', undefined);
    }),
  )
  .pipe(
    serializable({
      key: '@course/enrollments/my',
      schema: Result.Schema({
        success: EnrollmentsSchema,
        error: RpcClientError.RpcClientError,
      }),
    }),
  );

// ============================================================================
// Mutation Atoms
// ============================================================================

/**
 * Enroll in a course
 */
export const enrollInCourseAtom = EnrollmentClient.runtime.fn<CreateEnrollmentInput>()(
  Effect.fnUntraced(function* (input, get) {
    const client = yield* EnrollmentClient;
    const result = yield* client('enrollment_enroll', { input });
    get.refresh(myEnrollmentsAtom);
    return result;
  }),
);

/**
 * Check if the current user is enrolled in a specific course
 */
export const checkEnrollmentAtom = EnrollmentClient.runtime.fn<{
  courseId: CourseId;
}>()(
  Effect.fnUntraced(function* ({ courseId }) {
    const client = yield* EnrollmentClient;
    return yield* client('enrollment_isEnrolled', { courseId });
  }),
);
