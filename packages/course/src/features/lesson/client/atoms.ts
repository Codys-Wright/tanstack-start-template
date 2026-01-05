import { serializable } from '@core/client/atom-utils';
import { Result } from '@effect-atom/atom-react';
import * as RpcClientError from '@effect/rpc/RpcClientError';
import * as Effect from 'effect/Effect';
import * as S from 'effect/Schema';
import { CourseId } from '../../course/domain/schema.js';
import { SectionId } from '../../section/domain/schema.js';
import { CreateLessonInput, Lesson, LessonId, UpdateLessonInput } from '../domain/index.js';
import { LessonClient } from './client.js';

const LessonsSchema = S.Array(Lesson);

// ============================================================================
// Query Atoms
// ============================================================================

/**
 * Lessons for a specific section (parameterized atom family)
 */
export const lessonsBySectionAtomFamily = (sectionId: SectionId) =>
  LessonClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* LessonClient;
        return yield* client('lesson_listBySection', { sectionId });
      }),
    )
    .pipe(
      serializable({
        key: `@course/lessons/section/${sectionId}`,
        schema: Result.Schema({
          success: LessonsSchema,
          error: RpcClientError.RpcClientError,
        }),
      }),
    );

/**
 * All lessons for a course (parameterized atom family)
 */
export const lessonsByCourseAtomFamily = (courseId: CourseId) =>
  LessonClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* LessonClient;
        return yield* client('lesson_listByCourse', { courseId });
      }),
    )
    .pipe(
      serializable({
        key: `@course/lessons/course/${courseId}`,
        schema: Result.Schema({
          success: LessonsSchema,
          error: RpcClientError.RpcClientError,
        }),
      }),
    );

/**
 * Free preview lessons for a course
 */
export const freePreviewLessonsAtomFamily = (courseId: CourseId) =>
  LessonClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* LessonClient;
        return yield* client('lesson_listFreePreview', { courseId });
      }),
    )
    .pipe(
      serializable({
        key: `@course/lessons/preview/${courseId}`,
        schema: Result.Schema({
          success: LessonsSchema,
          error: RpcClientError.RpcClientError,
        }),
      }),
    );

// ============================================================================
// Mutation Atoms
// ============================================================================

/**
 * Create a new lesson
 */
export const createLessonAtom = LessonClient.runtime.fn<CreateLessonInput>()(
  Effect.fnUntraced(function* (input) {
    const client = yield* LessonClient;
    return yield* client('lesson_create', { input });
  }),
);

/**
 * Update an existing lesson
 */
export const updateLessonAtom = LessonClient.runtime.fn<{
  readonly id: LessonId;
  readonly input: UpdateLessonInput;
}>()(
  Effect.fnUntraced(function* ({ id, input }) {
    const client = yield* LessonClient;
    return yield* client('lesson_update', { id, input });
  }),
);

/**
 * Delete a lesson
 */
export const deleteLessonAtom = LessonClient.runtime.fn<LessonId>()(
  Effect.fnUntraced(function* (id) {
    const client = yield* LessonClient;
    yield* client('lesson_delete', { id });
  }),
);
