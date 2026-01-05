import { UserId } from '@auth';
import * as Effect from 'effect/Effect';
import { ProgressRepository } from '../database/repo.js';
import { LessonRepository } from '../../lesson/database/repo.js';
import { EnrollmentRepository } from '../../enrollment/database/repo.js';
import type { CourseId } from '../../course/domain/schema.js';
import type { EnrollmentId } from '../../enrollment/domain/schema.js';
import type { LessonId } from '../../lesson/domain/schema.js';
import type { ProgressId, UpdateProgressInput } from '../domain/index.js';

export class ProgressService extends Effect.Service<ProgressService>()('@course/ProgressService', {
  dependencies: [
    ProgressRepository.Default,
    LessonRepository.Default,
    EnrollmentRepository.Default,
  ],
  effect: Effect.gen(function* () {
    const repo = yield* ProgressRepository;
    const lessonRepo = yield* LessonRepository;
    const enrollmentRepo = yield* EnrollmentRepository;

    return {
      getById: (id: ProgressId) => repo.findById(id),
      getByUserAndLesson: (userId: UserId, lessonId: LessonId) =>
        repo.findByUserAndLesson(userId, lessonId),
      listByEnrollment: (enrollmentId: EnrollmentId) => repo.findByEnrollment(enrollmentId),
      listByUserAndCourse: (userId: UserId, courseId: CourseId) =>
        repo.findByUserAndCourse(userId, courseId),
      countCompleted: (enrollmentId: EnrollmentId) => repo.countCompletedByEnrollment(enrollmentId),
      startLesson: (
        userId: UserId,
        lessonId: LessonId,
        courseId: CourseId,
        enrollmentId: EnrollmentId,
      ) =>
        repo
          .getOrCreate(userId, lessonId, courseId, enrollmentId)
          .pipe(
            Effect.flatMap((progress) =>
              progress.status === 'not_started'
                ? repo.markStarted(progress.id)
                : Effect.succeed(progress),
            ),
          ),

      /**
       * Start a lesson for a user - resolves lesson and enrollment automatically
       * Used by RPC layer for convenience
       */
      startLessonForUser: (userId: UserId, lessonId: LessonId, enrollmentId: EnrollmentId) =>
        Effect.gen(function* () {
          const lesson = yield* lessonRepo.findById(lessonId);
          const progress = yield* repo.getOrCreate(userId, lessonId, lesson.courseId, enrollmentId);
          if (progress.status === 'not_started') {
            return yield* repo.markStarted(progress.id);
          }
          return progress;
        }),

      /**
       * Mark lesson complete for a user - looks up enrollment automatically
       * Used by RPC layer for convenience
       */
      markLessonCompleteForUser: (userId: UserId, lessonId: LessonId) =>
        Effect.gen(function* () {
          const existing = yield* repo.findByUserAndLesson(userId, lessonId);
          if (!existing) {
            // Need to look up lesson and enrollment to create progress first
            const lesson = yield* lessonRepo.findById(lessonId);
            const enrollment = yield* enrollmentRepo.findByUserAndCourse(userId, lesson.courseId);
            if (!enrollment) {
              return yield* Effect.die(new Error('Not enrolled in this course'));
            }
            // Create and immediately complete
            const progress = yield* repo.getOrCreate(
              userId,
              lessonId,
              lesson.courseId,
              enrollment.id,
            );
            return yield* repo.markCompleted(progress.id);
          }
          return yield* repo.markCompleted(existing.id);
        }),

      updateProgress: (id: ProgressId, input: UpdateProgressInput) => repo.update(id, input),
      markCompleted: (id: ProgressId) => repo.markCompleted(id),
    } as const;
  }),
}) {}
