import { UserId } from '@auth';
import * as Effect from 'effect/Effect';
import { CertificateRepository } from '../database/repo.js';
import type { CourseId } from '../../course/domain/schema.js';
import type { EnrollmentId } from '../../enrollment/domain/schema.js';
import type { CertificateId, IssueCertificateInput } from '../domain/index.js';

export class CertificateService extends Effect.Service<CertificateService>()(
  '@course/CertificateService',
  {
    dependencies: [CertificateRepository.Default],
    effect: Effect.gen(function* () {
      const repo = yield* CertificateRepository;

      return {
        getById: (id: CertificateId) => repo.findById(id),
        getByEnrollment: (enrollmentId: EnrollmentId) => repo.findByEnrollment(enrollmentId),
        verify: (code: string) => repo.findByVerificationCode(code),
        listByUser: (userId: UserId) => repo.findByUser(userId),
        listByCourse: (courseId: CourseId) => repo.findByCourse(courseId),
        issue: (
          input: IssueCertificateInput,
          userId: UserId,
          courseId: CourseId,
          courseTitle: string,
          instructorName: string,
        ) => repo.issue(input, userId, courseId, courseTitle, instructorName),
        delete: (id: CertificateId) => repo.delete(id),
      } as const;
    }),
  },
) {}
