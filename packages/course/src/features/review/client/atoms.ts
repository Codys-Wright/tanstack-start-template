import { serializable } from '@core/client/atom-utils';
import { Result } from '@effect-atom/atom-react';
import * as RpcClientError from '@effect/rpc/RpcClientError';
import * as Effect from 'effect/Effect';
import * as S from 'effect/Schema';
import { CourseId } from '../../course/domain/schema.js';
import {
  CourseRatingStats,
  CreateReviewInput,
  RespondToReviewInput,
  Review,
  ReviewId,
  UpdateReviewInput,
} from '../domain/index.js';
import { ReviewClient } from './client.js';

const ReviewsSchema = S.Array(Review);

// ============================================================================
// Query Atoms
// ============================================================================

/**
 * Current user's reviews across all courses
 */
export const myReviewsAtom = ReviewClient.runtime
  .atom(
    Effect.gen(function* () {
      const client = yield* ReviewClient;
      return yield* client('review_listMyReviews', undefined);
    }),
  )
  .pipe(
    serializable({
      key: '@course/reviews/my',
      schema: Result.Schema({
        success: ReviewsSchema,
        error: RpcClientError.RpcClientError,
      }),
    }),
  );

/**
 * Approved reviews for a course (public display)
 */
export const approvedReviewsByCourseAtomFamily = (courseId: CourseId) =>
  ReviewClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* ReviewClient;
        return yield* client('review_listApprovedByCourse', { courseId });
      }),
    )
    .pipe(
      serializable({
        key: `@course/reviews/approved/${courseId}`,
        schema: Result.Schema({
          success: ReviewsSchema,
          error: RpcClientError.RpcClientError,
        }),
      }),
    );

/**
 * Featured reviews for a course (homepage/marketing)
 */
export const featuredReviewsByCourseAtomFamily = (courseId: CourseId) =>
  ReviewClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* ReviewClient;
        return yield* client('review_listFeaturedByCourse', { courseId });
      }),
    )
    .pipe(
      serializable({
        key: `@course/reviews/featured/${courseId}`,
        schema: Result.Schema({
          success: ReviewsSchema,
          error: RpcClientError.RpcClientError,
        }),
      }),
    );

/**
 * Course rating statistics (average, distribution)
 */
export const courseRatingStatsAtomFamily = (courseId: CourseId) =>
  ReviewClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* ReviewClient;
        return yield* client('review_getCourseStats', { courseId });
      }),
    )
    .pipe(
      serializable({
        key: `@course/reviews/stats/${courseId}`,
        schema: Result.Schema({
          success: CourseRatingStats,
          error: RpcClientError.RpcClientError,
        }),
      }),
    );

/**
 * Get current user's review for a specific course
 */
export const getMyReviewAtom = ReviewClient.runtime.fn<{
  readonly courseId: CourseId;
}>()(
  Effect.fnUntraced(function* ({ courseId }) {
    const client = yield* ReviewClient;
    return yield* client('review_getMyReview', { courseId });
  }),
);

// ============================================================================
// Mutation Atoms
// ============================================================================

/**
 * Create a new review for a course
 */
export const createReviewAtom = ReviewClient.runtime.fn<CreateReviewInput>()(
  Effect.fnUntraced(function* (input, get) {
    const client = yield* ReviewClient;
    const result = yield* client('review_create', { input });
    get.refresh(myReviewsAtom);
    return result;
  }),
);

/**
 * Update an existing review
 */
export const updateReviewAtom = ReviewClient.runtime.fn<{
  readonly id: ReviewId;
  readonly input: UpdateReviewInput;
}>()(
  Effect.fnUntraced(function* ({ id, input }, get) {
    const client = yield* ReviewClient;
    const result = yield* client('review_update', { id, input });
    get.refresh(myReviewsAtom);
    return result;
  }),
);

/**
 * Instructor responds to a review
 */
export const respondToReviewAtom = ReviewClient.runtime.fn<{
  readonly id: ReviewId;
  readonly input: RespondToReviewInput;
}>()(
  Effect.fnUntraced(function* ({ id, input }) {
    const client = yield* ReviewClient;
    return yield* client('review_respond', { id, input });
  }),
);

/**
 * Mark a review as helpful
 */
export const markReviewHelpfulAtom = ReviewClient.runtime.fn<ReviewId>()(
  Effect.fnUntraced(function* (id) {
    const client = yield* ReviewClient;
    yield* client('review_markHelpful', { id });
  }),
);

/**
 * Delete a review
 */
export const deleteReviewAtom = ReviewClient.runtime.fn<ReviewId>()(
  Effect.fnUntraced(function* (id, get) {
    const client = yield* ReviewClient;
    yield* client('review_delete', { id });
    get.refresh(myReviewsAtom);
  }),
);
