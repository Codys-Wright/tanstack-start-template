// Enrollment Domain Schema
// Defines user enrollments in courses

import { UserId } from '@auth';
import * as HttpApiSchema from '@effect/platform/HttpApiSchema';
import * as S from 'effect/Schema';

import { CourseId } from '../../course/domain/schema.js';

// ===========================================
// Branded IDs
// ===========================================

export const EnrollmentId = S.UUID.pipe(S.brand('EnrollmentId'));
export type EnrollmentId = typeof EnrollmentId.Type;

// ===========================================
// Enums / Literals
// ===========================================

export const EnrollmentStatus = S.Literal('active', 'expired', 'refunded', 'cancelled');
export type EnrollmentStatus = typeof EnrollmentStatus.Type;

export const EnrollmentSource = S.Literal('purchase', 'subscription', 'gift', 'promo', 'free');
export type EnrollmentSource = typeof EnrollmentSource.Type;

// ===========================================
// Enrollment Entity
// ===========================================

/**
 * Enrollment - represents a user's access to a course
 *
 * Tracks enrollment status, source, and progress summary.
 * Progress is denormalized from lesson_progress for performance.
 */
export class Enrollment extends S.Class<Enrollment>('Enrollment')({
  id: EnrollmentId,
  userId: UserId,
  courseId: CourseId,

  // Status
  status: EnrollmentStatus,
  source: EnrollmentSource,

  // Payment references (for future payment integration)
  purchaseId: S.optional(S.NullOr(S.UUID)),
  subscriptionId: S.optional(S.NullOr(S.UUID)),

  // Access window
  enrolledAt: S.DateTimeUtc,
  expiresAt: S.optional(S.NullOr(S.DateTimeUtc)),

  // Progress summary (denormalized for performance)
  progressPercent: S.Number,
  completedLessonCount: S.Number,
  lastAccessedAt: S.optional(S.NullOr(S.DateTimeUtc)),
  completedAt: S.optional(S.NullOr(S.DateTimeUtc)),

  // Timestamps
  createdAt: S.DateTimeUtc,
  updatedAt: S.DateTimeUtc,
}) {}

// ===========================================
// Input Schemas
// ===========================================

/**
 * Input for enrolling in a course
 */
export class CreateEnrollmentInput extends S.Class<CreateEnrollmentInput>('CreateEnrollmentInput')({
  userId: UserId,
  courseId: CourseId,
  source: EnrollmentSource,
  purchaseId: S.optional(S.NullOr(S.UUID)),
  subscriptionId: S.optional(S.NullOr(S.UUID)),
  expiresAt: S.optional(S.NullOr(S.DateTimeUtc)),
}) {}

/**
 * Input for updating enrollment status
 */
export class UpdateEnrollmentInput extends S.Class<UpdateEnrollmentInput>('UpdateEnrollmentInput')({
  status: S.optional(EnrollmentStatus),
  expiresAt: S.optional(S.NullOr(S.DateTimeUtc)),
}) {}

// ===========================================
// Query Filters
// ===========================================

/**
 * Filter for listing enrollments
 */
export class EnrollmentFilter extends S.Class<EnrollmentFilter>('EnrollmentFilter')({
  userId: S.optional(UserId),
  courseId: S.optional(CourseId),
  status: S.optional(EnrollmentStatus),
  source: S.optional(EnrollmentSource),
}) {}

// ===========================================
// Errors
// ===========================================

export class EnrollmentNotFoundError extends S.TaggedError<EnrollmentNotFoundError>(
  'EnrollmentNotFoundError',
)('EnrollmentNotFoundError', { id: EnrollmentId }, HttpApiSchema.annotations({ status: 404 })) {
  override get message() {
    return `Enrollment with id ${this.id} not found`;
  }
}

export class AlreadyEnrolledError extends S.TaggedError<AlreadyEnrolledError>(
  'AlreadyEnrolledError',
)(
  'AlreadyEnrolledError',
  { userId: UserId, courseId: CourseId },
  HttpApiSchema.annotations({ status: 409 }),
) {
  override get message() {
    return `User ${this.userId} is already enrolled in course ${this.courseId}`;
  }
}

export class EnrollmentExpiredError extends S.TaggedError<EnrollmentExpiredError>(
  'EnrollmentExpiredError',
)('EnrollmentExpiredError', { id: EnrollmentId }, HttpApiSchema.annotations({ status: 403 })) {
  override get message() {
    return `Enrollment ${this.id} has expired`;
  }
}
