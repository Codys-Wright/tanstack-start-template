import * as Rpc from '@effect/rpc/Rpc';
import * as RpcGroup from '@effect/rpc/RpcGroup';
import * as S from 'effect/Schema';
import {
  CourseProgressSummary,
  LessonProgress,
  ProgressId,
  ProgressNotFoundError,
  UpdateProgressInput,
} from './schema.js';
import { CourseId } from '../../course/domain/schema.js';
import { EnrollmentId } from '../../enrollment/domain/schema.js';
import { LessonId, LessonNotFoundError } from '../../lesson/domain/schema.js';

export class ProgressRpc extends RpcGroup.make(
  // ─────────────────────────────────────────────────────────────────────────────
  // Queries
  // ─────────────────────────────────────────────────────────────────────────────

  Rpc.make('getById', {
    success: LessonProgress,
    error: ProgressNotFoundError,
    payload: { id: ProgressId },
  }),

  Rpc.make('getByLesson', {
    success: S.NullOr(LessonProgress),
    payload: { lessonId: LessonId },
  }),

  Rpc.make('listByEnrollment', {
    success: S.Array(LessonProgress),
    payload: { enrollmentId: EnrollmentId },
  }),

  Rpc.make('listByCourse', {
    success: S.Array(LessonProgress),
    payload: { courseId: CourseId },
  }),

  Rpc.make('getCourseSummary', {
    success: CourseProgressSummary,
    payload: { courseId: CourseId },
  }),

  Rpc.make('countCompleted', {
    success: S.Number,
    payload: { enrollmentId: EnrollmentId },
  }),

  // ─────────────────────────────────────────────────────────────────────────────
  // Mutations
  // ─────────────────────────────────────────────────────────────────────────────

  Rpc.make('startLesson', {
    success: LessonProgress,
    error: S.Union(ProgressNotFoundError, LessonNotFoundError),
    payload: { lessonId: LessonId, enrollmentId: EnrollmentId },
  }),

  Rpc.make('updateProgress', {
    success: LessonProgress,
    error: ProgressNotFoundError,
    payload: { id: ProgressId, input: UpdateProgressInput },
  }),

  Rpc.make('markCompleted', {
    success: LessonProgress,
    error: ProgressNotFoundError,
    payload: { id: ProgressId },
  }),

  Rpc.make('markLessonComplete', {
    success: LessonProgress,
    error: S.Union(ProgressNotFoundError, LessonNotFoundError),
    payload: { lessonId: LessonId },
  }),
).prefix('progress_') {}
