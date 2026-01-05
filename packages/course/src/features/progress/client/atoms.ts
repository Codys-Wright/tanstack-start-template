import { serializable } from '@core/client/atom-utils';
import { Result } from '@effect-atom/atom-react';
import * as RpcClientError from '@effect/rpc/RpcClientError';
import * as Effect from 'effect/Effect';
import * as S from 'effect/Schema';
import { CourseId } from '../../course/domain/schema.js';
import { EnrollmentId } from '../../enrollment/domain/schema.js';
import { LessonId } from '../../lesson/domain/schema.js';
import {
  CourseProgressSummary,
  LessonProgress,
  ProgressId,
  UpdateProgressInput,
} from '../domain/index.js';
import { ProgressClient } from './client.js';

const ProgressListSchema = S.Array(LessonProgress);

// ============================================================================
// Query Atoms
// ============================================================================

/**
 * Progress for a specific enrollment (parameterized atom family)
 */
export const progressByEnrollmentAtomFamily = (enrollmentId: EnrollmentId) =>
  ProgressClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* ProgressClient;
        return yield* client('progress_listByEnrollment', { enrollmentId });
      }),
    )
    .pipe(
      serializable({
        key: `@course/progress/enrollment/${enrollmentId}`,
        schema: Result.Schema({
          success: ProgressListSchema,
          error: RpcClientError.RpcClientError,
        }),
      }),
    );

/**
 * Progress for all lessons in a course (parameterized atom family)
 */
export const progressByCourseAtomFamily = (courseId: CourseId) =>
  ProgressClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* ProgressClient;
        return yield* client('progress_listByCourse', { courseId });
      }),
    )
    .pipe(
      serializable({
        key: `@course/progress/course/${courseId}`,
        schema: Result.Schema({
          success: ProgressListSchema,
          error: RpcClientError.RpcClientError,
        }),
      }),
    );

/**
 * Course progress summary (parameterized atom family)
 */
export const courseProgressSummaryAtomFamily = (courseId: CourseId) =>
  ProgressClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* ProgressClient;
        return yield* client('progress_getCourseSummary', { courseId });
      }),
    )
    .pipe(
      serializable({
        key: `@course/progress/summary/${courseId}`,
        schema: Result.Schema({
          success: CourseProgressSummary,
          error: RpcClientError.RpcClientError,
        }),
      }),
    );

// ============================================================================
// Mutation Atoms
// ============================================================================

/**
 * Start a lesson (creates or retrieves progress record)
 */
export const startLessonAtom = ProgressClient.runtime.fn<{
  readonly lessonId: LessonId;
  readonly enrollmentId: EnrollmentId;
}>()(
  Effect.fnUntraced(function* ({ lessonId, enrollmentId }) {
    const client = yield* ProgressClient;
    return yield* client('progress_startLesson', { lessonId, enrollmentId });
  }),
);

/**
 * Update progress on a lesson (e.g., video position)
 */
export const updateProgressAtom = ProgressClient.runtime.fn<{
  readonly id: ProgressId;
  readonly input: UpdateProgressInput;
}>()(
  Effect.fnUntraced(function* ({ id, input }) {
    const client = yield* ProgressClient;
    return yield* client('progress_updateProgress', { id, input });
  }),
);

/**
 * Mark a lesson as complete
 */
export const markLessonCompleteAtom = ProgressClient.runtime.fn<{
  readonly lessonId: LessonId;
}>()(
  Effect.fnUntraced(function* ({ lessonId }) {
    const client = yield* ProgressClient;
    return yield* client('progress_markLessonComplete', { lessonId });
  }),
);
