import { AuthContext } from '@auth/server';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { CertificateRpc, CertificateVerification } from '../domain/index.js';
import { CertificateService } from './service.js';
import { EnrollmentService } from '../../enrollment/server/service.js';
import { CourseService } from '../../course/server/service.js';
import { InstructorService } from '../../instructor/server/service.js';

export const CertificateRpcLive = CertificateRpc.toLayer(
  Effect.gen(function* () {
    const certificates = yield* CertificateService;
    const enrollments = yield* EnrollmentService;
    const courses = yield* CourseService;
    const instructors = yield* InstructorService;

    return CertificateRpc.of({
      certificate_getById: Effect.fn('CertificateRpc.getById')(function* ({ id }) {
        yield* Effect.log(`[RPC] Getting certificate by id: ${id}`);
        return yield* certificates.getById(id);
      }),

      certificate_getByEnrollment: Effect.fn('CertificateRpc.getByEnrollment')(function* ({
        enrollmentId,
      }) {
        yield* Effect.log(`[RPC] Getting certificate by enrollment: ${enrollmentId}`);
        return yield* certificates.getByEnrollment(enrollmentId);
      }),

      certificate_verify: Effect.fn('CertificateRpc.verify')(function* ({ code }) {
        yield* Effect.log(`[RPC] Verifying certificate: ${code}`);
        const certificate = yield* certificates.verify(code);
        return new CertificateVerification({
          isValid: certificate !== null,
          certificate: certificate ?? undefined,
        });
      }),

      certificate_listByUser: Effect.fn('CertificateRpc.listByUser')(function* ({ userId }) {
        yield* Effect.log(`[RPC] Listing certificates by user: ${userId}`);
        return yield* certificates.listByUser(userId);
      }),

      certificate_listMyCertificates: Effect.fn('CertificateRpc.listMyCertificates')(function* () {
        const auth = yield* AuthContext;
        yield* Effect.log(`[RPC] Listing my certificates: ${auth.userId}`);
        return yield* certificates.listByUser(auth.userId);
      }),

      certificate_listByCourse: Effect.fn('CertificateRpc.listByCourse')(function* ({ courseId }) {
        yield* Effect.log(`[RPC] Listing certificates by course: ${courseId}`);
        return yield* certificates.listByCourse(courseId);
      }),

      certificate_issue: Effect.fn('CertificateRpc.issue')(function* ({ input }) {
        yield* Effect.log(`[RPC] Issuing certificate for enrollment: ${input.enrollmentId}`);
        // Get enrollment to find user and course
        const enrollment = yield* enrollments.getById(input.enrollmentId);
        // Get course details
        const course = yield* courses.getById(enrollment.courseId);
        // Get instructor details
        const instructor = yield* instructors.getById(course.instructorId);

        return yield* certificates.issue(
          input,
          enrollment.userId,
          enrollment.courseId,
          course.title,
          instructor.displayName,
        );
      }),

      certificate_delete: Effect.fn('CertificateRpc.delete')(function* ({ id }) {
        yield* Effect.log(`[RPC] Deleting certificate: ${id}`);
        return yield* certificates.delete(id);
      }),
    });
  }),
).pipe(
  Layer.provide(CertificateService.Default),
  Layer.provide(EnrollmentService.Default),
  Layer.provide(CourseService.Default),
  Layer.provide(InstructorService.Default),
);
