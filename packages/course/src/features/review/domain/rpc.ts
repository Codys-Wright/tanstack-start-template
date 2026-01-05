import * as Rpc from '@effect/rpc/Rpc';
import * as RpcGroup from '@effect/rpc/RpcGroup';
import * as S from 'effect/Schema';
import { UserId } from '@auth';
import {
  CourseRatingStats,
  CreateReviewInput,
  MustBeEnrolledToReviewError,
  RespondToReviewInput,
  Review,
  ReviewId,
  ReviewNotFoundError,
  UpdateReviewInput,
} from './schema.js';
import { CourseId } from '../../course/domain/schema.js';

export class ReviewRpc extends RpcGroup.make(
  // ─────────────────────────────────────────────────────────────────────────────
  // Queries
  // ─────────────────────────────────────────────────────────────────────────────

  Rpc.make('getById', {
    success: Review,
    error: ReviewNotFoundError,
    payload: { id: ReviewId },
  }),

  Rpc.make('getByUserAndCourse', {
    success: S.NullOr(Review),
    payload: { userId: UserId, courseId: CourseId },
  }),

  Rpc.make('getMyReview', {
    success: S.NullOr(Review),
    payload: { courseId: CourseId },
  }),

  Rpc.make('listByCourse', {
    success: S.Array(Review),
    payload: { courseId: CourseId },
  }),

  Rpc.make('listApprovedByCourse', {
    success: S.Array(Review),
    payload: { courseId: CourseId },
  }),

  Rpc.make('listFeaturedByCourse', {
    success: S.Array(Review),
    payload: { courseId: CourseId },
  }),

  Rpc.make('listByUser', {
    success: S.Array(Review),
    payload: { userId: UserId },
  }),

  Rpc.make('listMyReviews', {
    success: S.Array(Review),
  }),

  Rpc.make('getCourseStats', {
    success: CourseRatingStats,
    payload: { courseId: CourseId },
  }),

  // ─────────────────────────────────────────────────────────────────────────────
  // Mutations
  // ─────────────────────────────────────────────────────────────────────────────

  Rpc.make('create', {
    success: Review,
    error: MustBeEnrolledToReviewError,
    payload: { input: CreateReviewInput },
  }),

  Rpc.make('update', {
    success: Review,
    error: ReviewNotFoundError,
    payload: { id: ReviewId, input: UpdateReviewInput },
  }),

  Rpc.make('respond', {
    success: Review,
    error: ReviewNotFoundError,
    payload: { id: ReviewId, input: RespondToReviewInput },
  }),

  Rpc.make('approve', {
    success: Review,
    error: ReviewNotFoundError,
    payload: { id: ReviewId },
  }),

  Rpc.make('setFeatured', {
    success: Review,
    error: ReviewNotFoundError,
    payload: { id: ReviewId, featured: S.Boolean },
  }),

  Rpc.make('markHelpful', {
    success: S.Void,
    payload: { id: ReviewId },
  }),

  Rpc.make('delete', {
    success: S.Void,
    error: ReviewNotFoundError,
    payload: { id: ReviewId },
  }),
).prefix('review_') {}
