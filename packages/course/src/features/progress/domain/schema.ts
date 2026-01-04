// Progress Domain Schema
// Tracks user progress through lessons

import { UserId } from '@auth';
import * as HttpApiSchema from '@effect/platform/HttpApiSchema';
import * as S from 'effect/Schema';

import { CourseId } from '../../course/domain/schema.js';
import { EnrollmentId } from '../../enrollment/domain/schema.js';
import { LessonId } from '../../lesson/domain/schema.js';

// ===========================================
// Branded IDs
// ===========================================

export const ProgressId = S.UUID.pipe(S.brand('ProgressId'));
export type ProgressId = typeof ProgressId.Type;

// ===========================================
// Enums / Literals
// ===========================================

export const ProgressStatus = S.Literal('not_started', 'in_progress', 'completed');
export type ProgressStatus = typeof ProgressStatus.Type;

// ===========================================
// Progress Entity
// ===========================================

/**
 * LessonProgress - tracks a user's progress on a specific lesson
 *
 * Includes:
 * - Video watch progress (time watched, resume position)
 * - Quiz attempts and scores
 * - Completion status
 */
export class LessonProgress extends S.Class<LessonProgress>('LessonProgress')({
  id: ProgressId,
  userId: UserId,
  lessonId: LessonId,
  courseId: CourseId,
  enrollmentId: EnrollmentId,

  // Status
  status: ProgressStatus,

  // Video progress
  watchedSeconds: S.optional(S.Number),
  lastPosition: S.optional(S.Number),

  // Quiz progress
  quizAttemptId: S.optional(S.NullOr(S.String)),
  quizScore: S.optional(S.NullOr(S.Number)),
  quizPassed: S.optional(S.NullOr(S.Boolean)),

  // Timing
  startedAt: S.optional(S.NullOr(S.DateTimeUtc)),
  completedAt: S.optional(S.NullOr(S.DateTimeUtc)),

  // Timestamps
  createdAt: S.DateTimeUtc,
  updatedAt: S.DateTimeUtc,
}) {}

// ===========================================
// Input Schemas
// ===========================================

/**
 * Input for updating lesson progress
 */
export class UpdateProgressInput extends S.Class<UpdateProgressInput>('UpdateProgressInput')({
  lessonId: LessonId,
  status: S.optional(ProgressStatus),
  watchedSeconds: S.optional(S.Number.pipe(S.int(), S.nonNegative())),
  lastPosition: S.optional(S.Number.pipe(S.int(), S.nonNegative())),
  quizAttemptId: S.optional(S.NullOr(S.String)),
  quizScore: S.optional(S.NullOr(S.Number.pipe(S.between(0, 100)))),
  quizPassed: S.optional(S.NullOr(S.Boolean)),
}) {}

/**
 * Input for marking a lesson complete
 */
export class MarkLessonCompleteInput extends S.Class<MarkLessonCompleteInput>(
  'MarkLessonCompleteInput',
)({
  lessonId: LessonId,
}) {}

// ===========================================
// Aggregate Types
// ===========================================

/**
 * Course progress summary for a user
 */
export class CourseProgressSummary extends S.Class<CourseProgressSummary>('CourseProgressSummary')({
  courseId: CourseId,
  userId: UserId,
  totalLessons: S.Number,
  completedLessons: S.Number,
  inProgressLessons: S.Number,
  progressPercent: S.Number,
  isCompleted: S.Boolean,
  lastAccessedAt: S.optional(S.NullOr(S.DateTimeUtc)),
  completedAt: S.optional(S.NullOr(S.DateTimeUtc)),
}) {}

// ===========================================
// Errors
// ===========================================

export class ProgressNotFoundError extends S.TaggedError<ProgressNotFoundError>(
  'ProgressNotFoundError',
)('ProgressNotFoundError', { id: ProgressId }, HttpApiSchema.annotations({ status: 404 })) {
  override get message() {
    return `Progress with id ${this.id} not found`;
  }
}
