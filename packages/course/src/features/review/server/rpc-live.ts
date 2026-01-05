import { AuthContext } from '@auth/server';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import type { CourseRatingStats } from '../domain/index.js';
import { ReviewRpc } from '../domain/index.js';
import { ReviewService } from './service.js';

export const ReviewRpcLive = ReviewRpc.toLayer(
  Effect.gen(function* () {
    const reviews = yield* ReviewService;

    return ReviewRpc.of({
      review_getById: Effect.fn('ReviewRpc.getById')(function* ({ id }) {
        yield* Effect.log(`[RPC] Getting review by id: ${id}`);
        return yield* reviews.getById(id);
      }),

      review_getByUserAndCourse: Effect.fn('ReviewRpc.getByUserAndCourse')(function* ({
        userId,
        courseId,
      }) {
        yield* Effect.log(`[RPC] Getting review for user: ${userId}, course: ${courseId}`);
        return yield* reviews.getByUserAndCourse(userId, courseId);
      }),

      review_getMyReview: Effect.fn('ReviewRpc.getMyReview')(function* ({ courseId }) {
        const auth = yield* AuthContext;
        yield* Effect.log(`[RPC] Getting my review for course: ${courseId}`);
        return yield* reviews.getByUserAndCourse(auth.userId, courseId);
      }),

      review_listByCourse: Effect.fn('ReviewRpc.listByCourse')(function* ({ courseId }) {
        yield* Effect.log(`[RPC] Listing reviews for course: ${courseId}`);
        return yield* reviews.listByCourse(courseId);
      }),

      review_listApprovedByCourse: Effect.fn('ReviewRpc.listApprovedByCourse')(function* ({
        courseId,
      }) {
        yield* Effect.log(`[RPC] Listing approved reviews for course: ${courseId}`);
        return yield* reviews.listApprovedByCourse(courseId);
      }),

      review_listFeaturedByCourse: Effect.fn('ReviewRpc.listFeaturedByCourse')(function* ({
        courseId,
      }) {
        yield* Effect.log(`[RPC] Listing featured reviews for course: ${courseId}`);
        return yield* reviews.listFeaturedByCourse(courseId);
      }),

      review_listByUser: Effect.fn('ReviewRpc.listByUser')(function* ({ userId }) {
        yield* Effect.log(`[RPC] Listing reviews by user: ${userId}`);
        return yield* reviews.listByUser(userId);
      }),

      review_listMyReviews: Effect.fn('ReviewRpc.listMyReviews')(function* () {
        const auth = yield* AuthContext;
        yield* Effect.log(`[RPC] Listing my reviews: ${auth.userId}`);
        return yield* reviews.listByUser(auth.userId);
      }),

      review_getCourseStats: Effect.fn('ReviewRpc.getCourseStats')(function* ({ courseId }) {
        yield* Effect.log(`[RPC] Getting course stats: ${courseId}`);
        const reviewList = yield* reviews.listApprovedByCourse(courseId);
        const count = reviewList.length;
        const sum = reviewList.reduce((acc, r) => acc + r.rating, 0);
        const avg = count > 0 ? sum / count : 0;
        const distribution = { one: 0, two: 0, three: 0, four: 0, five: 0 };
        reviewList.forEach((r) => {
          const rating = Math.min(5, Math.max(1, Math.round(r.rating)));
          if (rating === 1) distribution.one++;
          else if (rating === 2) distribution.two++;
          else if (rating === 3) distribution.three++;
          else if (rating === 4) distribution.four++;
          else distribution.five++;
        });
        return {
          courseId,
          averageRating: Math.round(avg * 10) / 10,
          totalReviews: count,
          ratingDistribution: distribution,
        } as CourseRatingStats;
      }),

      review_create: Effect.fn('ReviewRpc.create')(function* ({ input }) {
        const auth = yield* AuthContext;
        yield* Effect.log(`[RPC] Creating review for course: ${input.courseId}`);
        return yield* reviews.createForCourse(input, auth.userId);
      }),

      review_update: Effect.fn('ReviewRpc.update')(function* ({ id, input }) {
        yield* Effect.log(`[RPC] Updating review: ${id}`);
        return yield* reviews.update(id, input);
      }),

      review_respond: Effect.fn('ReviewRpc.respond')(function* ({ id, input }) {
        yield* Effect.log(`[RPC] Responding to review: ${id}`);
        return yield* reviews.respond(id, input.response);
      }),

      review_approve: Effect.fn('ReviewRpc.approve')(function* ({ id }) {
        yield* Effect.log(`[RPC] Approving review: ${id}`);
        return yield* reviews.approve(id);
      }),

      review_setFeatured: Effect.fn('ReviewRpc.setFeatured')(function* ({ id, featured }) {
        yield* Effect.log(`[RPC] Setting review featured: ${id} -> ${featured}`);
        return yield* reviews.setFeatured(id, featured);
      }),

      review_markHelpful: Effect.fn('ReviewRpc.markHelpful')(function* ({ id }) {
        yield* Effect.log(`[RPC] Marking review helpful: ${id}`);
        return yield* reviews.markHelpful(id);
      }),

      review_delete: Effect.fn('ReviewRpc.delete')(function* ({ id }) {
        yield* Effect.log(`[RPC] Deleting review: ${id}`);
        return yield* reviews.delete(id);
      }),
    });
  }),
).pipe(Layer.provide(ReviewService.Default));
