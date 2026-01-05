import { UserId } from '@auth';
import { PgLive } from '@core/database';
import * as SqlClient from '@effect/sql/SqlClient';
import * as SqlSchema from '@effect/sql/SqlSchema';
import * as Effect from 'effect/Effect';
import * as S from 'effect/Schema';

import { CourseId } from '../../course/domain/schema.js';
import { EnrollmentId } from '../../enrollment/domain/schema.js';
import {
  Certificate,
  CertificateId,
  CertificateNotFoundError,
  IssueCertificateInput,
} from '../domain/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Internal Input Schemas
// ─────────────────────────────────────────────────────────────────────────────

const InsertCertificate = S.Struct({
  enrollment_id: S.UUID,
  user_id: UserId,
  course_id: S.UUID,
  recipient_name: S.String,
  course_title: S.String,
  instructor_name: S.String,
  verification_code: S.String,
});

// ─────────────────────────────────────────────────────────────────────────────
// Repository
// ─────────────────────────────────────────────────────────────────────────────

export class CertificateRepository extends Effect.Service<CertificateRepository>()(
  '@course/CertificateRepository',
  {
    dependencies: [PgLive],
    effect: Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      // ─────────────────────────────────────────────────────────────────────────
      // Queries
      // ─────────────────────────────────────────────────────────────────────────

      const findById = SqlSchema.single({
        Result: Certificate,
        Request: S.Struct({ id: CertificateId }),
        execute: ({ id }) => sql`
          SELECT
            id,
            enrollment_id AS "enrollmentId",
            user_id AS "userId",
            course_id AS "courseId",
            recipient_name AS "recipientName",
            course_title AS "courseTitle",
            instructor_name AS "instructorName",
            verification_code AS "verificationCode",
            issued_at AS "issuedAt",
            created_at AS "createdAt"
          FROM
            course_certificates
          WHERE
            id = ${id}
        `,
      });

      const findByVerificationCode = SqlSchema.single({
        Result: Certificate,
        Request: S.Struct({ code: S.String }),
        execute: ({ code }) => sql`
          SELECT
            id,
            enrollment_id AS "enrollmentId",
            user_id AS "userId",
            course_id AS "courseId",
            recipient_name AS "recipientName",
            course_title AS "courseTitle",
            instructor_name AS "instructorName",
            verification_code AS "verificationCode",
            issued_at AS "issuedAt",
            created_at AS "createdAt"
          FROM
            course_certificates
          WHERE
            verification_code = ${code}
        `,
      });

      const findByEnrollment = SqlSchema.single({
        Result: Certificate,
        Request: S.Struct({ enrollmentId: EnrollmentId }),
        execute: ({ enrollmentId }) => sql`
          SELECT
            id,
            enrollment_id AS "enrollmentId",
            user_id AS "userId",
            course_id AS "courseId",
            recipient_name AS "recipientName",
            course_title AS "courseTitle",
            instructor_name AS "instructorName",
            verification_code AS "verificationCode",
            issued_at AS "issuedAt",
            created_at AS "createdAt"
          FROM
            course_certificates
          WHERE
            enrollment_id = ${enrollmentId}
        `,
      });

      const findByUser = SqlSchema.findAll({
        Result: Certificate,
        Request: S.Struct({ userId: UserId }),
        execute: ({ userId }) => sql`
          SELECT
            id,
            enrollment_id AS "enrollmentId",
            user_id AS "userId",
            course_id AS "courseId",
            recipient_name AS "recipientName",
            course_title AS "courseTitle",
            instructor_name AS "instructorName",
            verification_code AS "verificationCode",
            issued_at AS "issuedAt",
            created_at AS "createdAt"
          FROM
            course_certificates
          WHERE
            user_id = ${userId}
          ORDER BY
            issued_at DESC
        `,
      });

      const findByCourse = SqlSchema.findAll({
        Result: Certificate,
        Request: S.Struct({ courseId: CourseId }),
        execute: ({ courseId }) => sql`
          SELECT
            id,
            enrollment_id AS "enrollmentId",
            user_id AS "userId",
            course_id AS "courseId",
            recipient_name AS "recipientName",
            course_title AS "courseTitle",
            instructor_name AS "instructorName",
            verification_code AS "verificationCode",
            issued_at AS "issuedAt",
            created_at AS "createdAt"
          FROM
            course_certificates
          WHERE
            course_id = ${courseId}
          ORDER BY
            issued_at DESC
        `,
      });

      // ─────────────────────────────────────────────────────────────────────────
      // Mutations
      // ─────────────────────────────────────────────────────────────────────────

      const create = SqlSchema.single({
        Result: Certificate,
        Request: InsertCertificate,
        execute: (input) => sql`
          INSERT INTO course_certificates ${sql.insert(input)}
          RETURNING
            id,
            enrollment_id AS "enrollmentId",
            user_id AS "userId",
            course_id AS "courseId",
            recipient_name AS "recipientName",
            course_title AS "courseTitle",
            instructor_name AS "instructorName",
            verification_code AS "verificationCode",
            issued_at AS "issuedAt",
            created_at AS "createdAt"
        `,
      });

      const del = SqlSchema.single({
        Result: S.Unknown,
        Request: CertificateId,
        execute: (id) => sql`
          DELETE FROM course_certificates
          WHERE id = ${id}
          RETURNING id
        `,
      });

      // ─────────────────────────────────────────────────────────────────────────
      // Helper to generate verification code
      // ─────────────────────────────────────────────────────────────────────────

      const generateVerificationCode = (): string => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes similar chars
        let code = '';
        for (let i = 0; i < 12; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        // Format as XXX-XXX-XXX-XXX for readability
        return `${code.slice(0, 3)}-${code.slice(3, 6)}-${code.slice(6, 9)}-${code.slice(9, 12)}`;
      };

      // ─────────────────────────────────────────────────────────────────────────
      // Public API
      // ─────────────────────────────────────────────────────────────────────────

      return {
        findByUser: (userId: UserId) => findByUser({ userId }).pipe(Effect.orDie),

        findByCourse: (courseId: CourseId) => findByCourse({ courseId }).pipe(Effect.orDie),

        findById: (id: CertificateId) =>
          findById({ id }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new CertificateNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        findByVerificationCode: (code: string) =>
          findByVerificationCode({ code }).pipe(
            Effect.catchTag('NoSuchElementException', () => Effect.succeed(null)),
            Effect.catchTags({
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        findByEnrollment: (enrollmentId: EnrollmentId) =>
          findByEnrollment({ enrollmentId }).pipe(
            Effect.catchTag('NoSuchElementException', () => Effect.succeed(null)),
            Effect.catchTags({
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        issue: (
          input: IssueCertificateInput,
          userId: UserId,
          courseId: CourseId,
          courseTitle: string,
          instructorName: string,
        ) =>
          create({
            enrollment_id: input.enrollmentId,
            user_id: userId,
            course_id: courseId,
            recipient_name: input.recipientName,
            course_title: courseTitle,
            instructor_name: instructorName,
            verification_code: generateVerificationCode(),
          }).pipe(Effect.orDie),

        delete: (id: CertificateId) =>
          del(id).pipe(
            Effect.asVoid,
            Effect.catchTags({
              NoSuchElementException: () => new CertificateNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),
      } as const;
    }),
  },
) {}
