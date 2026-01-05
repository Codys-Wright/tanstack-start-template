import { UserId } from '@auth';
import * as Effect from 'effect/Effect';
import { EnrollmentRepository } from '../database/repo.js';
import type { CourseId } from '../../course/domain/schema.js';
import type {
  CreateEnrollmentInput,
  EnrollmentId,
  UpdateEnrollmentInput,
} from '../domain/index.js';

export class EnrollmentService extends Effect.Service<EnrollmentService>()(
  '@course/EnrollmentService',
  {
    dependencies: [EnrollmentRepository.Default],
    effect: Effect.gen(function* () {
      const repo = yield* EnrollmentRepository;

      return {
        getById: (id: EnrollmentId) => repo.findById(id),
        getByUserAndCourse: (userId: UserId, courseId: CourseId) =>
          repo.findByUserAndCourse(userId, courseId),
        listByUser: (userId: UserId) => repo.findByUser(userId),
        listByCourse: (courseId: CourseId) => repo.findByCourse(courseId),
        listActiveByUser: (userId: UserId) => repo.findActiveByUser(userId),
        isEnrolled: (userId: UserId, courseId: CourseId) => repo.isEnrolled(userId, courseId),
        enroll: (input: CreateEnrollmentInput) => repo.create(input),
        update: (id: EnrollmentId, input: UpdateEnrollmentInput) => repo.update(id, input),
        markCompleted: (id: EnrollmentId) => repo.markCompleted(id),
        cancel: (id: EnrollmentId) => repo.delete(id),
      } as const;
    }),
  },
) {}
