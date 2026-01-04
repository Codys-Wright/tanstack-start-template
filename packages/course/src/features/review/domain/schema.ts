// Review Domain Schema
// Defines course reviews and ratings

import { UserId } from '@auth';
import * as HttpApiSchema from '@effect/platform/HttpApiSchema';
import * as S from 'effect/Schema';

import { CourseId } from '../../course/domain/schema.js';
import { EnrollmentId } from '../../enrollment/domain/schema.js';

// ===========================================
// Branded IDs
// ===========================================

export const ReviewId = S.UUID.pipe(S.brand('ReviewId'));
export type ReviewId = typeof ReviewId.Type;

// ===========================================
// Review Entity
// ===========================================

/**
 * Review - a user's review and rating of a course
 *
 * Only enrolled users can leave reviews (one per course).
 * Instructors can respond to reviews.
 */
export class Review extends S.Class<Review>('Review')({
  id: ReviewId,
  courseId: CourseId,
  userId: UserId,
  enrollmentId: EnrollmentId,

  // Review content
  rating: S.Number.pipe(S.int(), S.between(1, 5)),
  title: S.optional(S.NullOr(S.String)),
  body: S.optional(S.NullOr(S.String)),

  // Instructor response
  instructorResponse: S.optional(S.NullOr(S.String)),
  respondedAt: S.optional(S.NullOr(S.DateTimeUtc)),

  // Moderation
  isApproved: S.Boolean,
  isFeatured: S.Boolean,

  // Engagement
  helpfulCount: S.Number,

  // Timestamps
  createdAt: S.DateTimeUtc,
  updatedAt: S.DateTimeUtc,
}) {}

// ===========================================
// Input Schemas
// ===========================================

export class CreateReviewInput extends S.Class<CreateReviewInput>('CreateReviewInput')({
  courseId: CourseId,
  rating: S.Number.pipe(S.int(), S.between(1, 5)),
  title: S.optional(S.NullOr(S.String.pipe(S.maxLength(200)))),
  body: S.optional(S.NullOr(S.String.pipe(S.maxLength(5000)))),
}) {}

export class UpdateReviewInput extends S.Class<UpdateReviewInput>('UpdateReviewInput')({
  rating: S.optional(S.Number.pipe(S.int(), S.between(1, 5))),
  title: S.optional(S.NullOr(S.String.pipe(S.maxLength(200)))),
  body: S.optional(S.NullOr(S.String.pipe(S.maxLength(5000)))),
}) {}

/**
 * Input for instructor responding to a review
 */
export class RespondToReviewInput extends S.Class<RespondToReviewInput>('RespondToReviewInput')({
  response: S.String.pipe(S.maxLength(2000)),
}) {}

// ===========================================
// Query Types
// ===========================================

/**
 * Filter for listing reviews
 */
export class ReviewFilter extends S.Class<ReviewFilter>('ReviewFilter')({
  courseId: S.optional(CourseId),
  userId: S.optional(UserId),
  minRating: S.optional(S.Number.pipe(S.int(), S.between(1, 5))),
  maxRating: S.optional(S.Number.pipe(S.int(), S.between(1, 5))),
  isApproved: S.optional(S.Boolean),
  isFeatured: S.optional(S.Boolean),
}) {}

/**
 * Aggregate rating stats for a course
 */
export class CourseRatingStats extends S.Class<CourseRatingStats>('CourseRatingStats')({
  courseId: CourseId,
  totalReviews: S.Number,
  averageRating: S.Number,
  ratingDistribution: S.Struct({
    one: S.Number,
    two: S.Number,
    three: S.Number,
    four: S.Number,
    five: S.Number,
  }),
}) {}

// ===========================================
// Errors
// ===========================================

export class ReviewNotFoundError extends S.TaggedError<ReviewNotFoundError>('ReviewNotFoundError')(
  'ReviewNotFoundError',
  { id: ReviewId },
  HttpApiSchema.annotations({ status: 404 }),
) {
  override get message() {
    return `Review with id ${this.id} not found`;
  }
}

export class ReviewAlreadyExistsError extends S.TaggedError<ReviewAlreadyExistsError>(
  'ReviewAlreadyExistsError',
)(
  'ReviewAlreadyExistsError',
  { userId: UserId, courseId: CourseId },
  HttpApiSchema.annotations({ status: 409 }),
) {
  override get message() {
    return `User ${this.userId} has already reviewed course ${this.courseId}`;
  }
}

export class MustBeEnrolledToReviewError extends S.TaggedError<MustBeEnrolledToReviewError>(
  'MustBeEnrolledToReviewError',
)(
  'MustBeEnrolledToReviewError',
  { userId: UserId, courseId: CourseId },
  HttpApiSchema.annotations({ status: 403 }),
) {
  override get message() {
    return `User ${this.userId} must be enrolled in course ${this.courseId} to leave a review`;
  }
}
