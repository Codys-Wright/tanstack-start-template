import { UserId } from '@auth';
import * as Effect from 'effect/Effect';
import { ReviewRepository } from '../database/repo.js';
import { EnrollmentRepository } from '../../enrollment/database/repo.js';
import type { CourseId } from '../../course/domain/schema.js';
import type { EnrollmentId } from '../../enrollment/domain/schema.js';
import type { CreateReviewInput, ReviewId, UpdateReviewInput } from '../domain/index.js';
import { MustBeEnrolledToReviewError } from '../domain/schema.js';

export class ReviewService extends Effect.Service<ReviewService>()('@course/ReviewService', {
  dependencies: [ReviewRepository.Default, EnrollmentRepository.Default],
  effect: Effect.gen(function* () {
    const repo = yield* ReviewRepository;
    const enrollmentRepo = yield* EnrollmentRepository;

    return {
      getById: (id: ReviewId) => repo.findById(id),
      getByUserAndCourse: (userId: UserId, courseId: CourseId) =>
        repo.findByUserAndCourse(userId, courseId),
      listByCourse: (courseId: CourseId) => repo.findByCourse(courseId),
      listApprovedByCourse: (courseId: CourseId) => repo.findApprovedByCourse(courseId),
      listFeaturedByCourse: (courseId: CourseId) => repo.findFeaturedByCourse(courseId),
      listByUser: (userId: UserId) => repo.findByUser(userId),
      create: (input: CreateReviewInput, userId: UserId, enrollmentId: EnrollmentId) =>
        repo.create(input, userId, enrollmentId),

      /**
       * Create a review for a course - looks up enrollment automatically
       * Used by RPC layer for convenience
       */
      createForCourse: (input: CreateReviewInput, userId: UserId) =>
        Effect.gen(function* () {
          const enrollment = yield* enrollmentRepo.findByUserAndCourse(userId, input.courseId);
          if (!enrollment) {
            return yield* new MustBeEnrolledToReviewError({
              userId,
              courseId: input.courseId,
            });
          }
          return yield* repo.create(input, userId, enrollment.id);
        }),

      update: (id: ReviewId, input: UpdateReviewInput) => repo.update(id, input),
      respond: (id: ReviewId, response: string) => repo.addInstructorResponse(id, response),
      approve: (id: ReviewId) => repo.approve(id),
      setFeatured: (id: ReviewId, featured: boolean) => repo.setFeatured(id, featured),
      markHelpful: (id: ReviewId) => repo.incrementHelpful(id),
      delete: (id: ReviewId) => repo.delete(id),
    } as const;
  }),
}) {}
