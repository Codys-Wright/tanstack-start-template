import { UserId } from '@auth';
import { PgLive } from '@core/database';
import * as SqlClient from '@effect/sql/SqlClient';
import * as SqlSchema from '@effect/sql/SqlSchema';
import * as Effect from 'effect/Effect';
import * as S from 'effect/Schema';

import { CourseId } from '../../course/domain/schema.js';
import {
  CreateEnrollmentInput,
  Enrollment,
  EnrollmentId,
  EnrollmentNotFoundError,
  EnrollmentSource,
  EnrollmentStatus,
  UpdateEnrollmentInput,
} from '../domain/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Internal Input Schemas
// ─────────────────────────────────────────────────────────────────────────────

const InsertEnrollment = S.Struct({
  user_id: UserId,
  course_id: S.UUID,
  status: EnrollmentStatus,
  source: EnrollmentSource,
  purchase_id: S.NullOr(S.UUID),
  subscription_id: S.NullOr(S.UUID),
  expires_at: S.NullOr(S.DateTimeUtc),
});

const UpdateEnrollmentDb = S.Struct({
  id: EnrollmentId,
  status: S.optional(EnrollmentStatus),
  expires_at: S.optional(S.NullOr(S.DateTimeUtc)),
});
type UpdateEnrollmentDb = typeof UpdateEnrollmentDb.Type;

// ─────────────────────────────────────────────────────────────────────────────
// Repository
// ─────────────────────────────────────────────────────────────────────────────

export class EnrollmentRepository extends Effect.Service<EnrollmentRepository>()(
  '@course/EnrollmentRepository',
  {
    dependencies: [PgLive],
    effect: Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      // ─────────────────────────────────────────────────────────────────────────
      // Queries
      // ─────────────────────────────────────────────────────────────────────────

      const findById = SqlSchema.single({
        Result: Enrollment,
        Request: S.Struct({ id: EnrollmentId }),
        execute: ({ id }) => sql`
          SELECT
            id,
            user_id AS "userId",
            course_id AS "courseId",
            status,
            source,
            purchase_id AS "purchaseId",
            subscription_id AS "subscriptionId",
            enrolled_at AS "enrolledAt",
            expires_at AS "expiresAt",
            progress_percent AS "progressPercent",
            completed_lesson_count AS "completedLessonCount",
            last_accessed_at AS "lastAccessedAt",
            completed_at AS "completedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM
            course_enrollments
          WHERE
            id = ${id}
        `,
      });

      const findByUserAndCourse = SqlSchema.single({
        Result: Enrollment,
        Request: S.Struct({ userId: UserId, courseId: CourseId }),
        execute: ({ userId, courseId }) => sql`
          SELECT
            id,
            user_id AS "userId",
            course_id AS "courseId",
            status,
            source,
            purchase_id AS "purchaseId",
            subscription_id AS "subscriptionId",
            enrolled_at AS "enrolledAt",
            expires_at AS "expiresAt",
            progress_percent AS "progressPercent",
            completed_lesson_count AS "completedLessonCount",
            last_accessed_at AS "lastAccessedAt",
            completed_at AS "completedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM
            course_enrollments
          WHERE
            user_id = ${userId}
            AND course_id = ${courseId}
        `,
      });

      const findByUser = SqlSchema.findAll({
        Result: Enrollment,
        Request: S.Struct({ userId: UserId }),
        execute: ({ userId }) => sql`
          SELECT
            id,
            user_id AS "userId",
            course_id AS "courseId",
            status,
            source,
            purchase_id AS "purchaseId",
            subscription_id AS "subscriptionId",
            enrolled_at AS "enrolledAt",
            expires_at AS "expiresAt",
            progress_percent AS "progressPercent",
            completed_lesson_count AS "completedLessonCount",
            last_accessed_at AS "lastAccessedAt",
            completed_at AS "completedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM
            course_enrollments
          WHERE
            user_id = ${userId}
          ORDER BY
            enrolled_at DESC
        `,
      });

      const findByCourse = SqlSchema.findAll({
        Result: Enrollment,
        Request: S.Struct({ courseId: CourseId }),
        execute: ({ courseId }) => sql`
          SELECT
            id,
            user_id AS "userId",
            course_id AS "courseId",
            status,
            source,
            purchase_id AS "purchaseId",
            subscription_id AS "subscriptionId",
            enrolled_at AS "enrolledAt",
            expires_at AS "expiresAt",
            progress_percent AS "progressPercent",
            completed_lesson_count AS "completedLessonCount",
            last_accessed_at AS "lastAccessedAt",
            completed_at AS "completedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM
            course_enrollments
          WHERE
            course_id = ${courseId}
          ORDER BY
            enrolled_at DESC
        `,
      });

      const findActiveByUser = SqlSchema.findAll({
        Result: Enrollment,
        Request: S.Struct({ userId: UserId }),
        execute: ({ userId }) => sql`
          SELECT
            id,
            user_id AS "userId",
            course_id AS "courseId",
            status,
            source,
            purchase_id AS "purchaseId",
            subscription_id AS "subscriptionId",
            enrolled_at AS "enrolledAt",
            expires_at AS "expiresAt",
            progress_percent AS "progressPercent",
            completed_lesson_count AS "completedLessonCount",
            last_accessed_at AS "lastAccessedAt",
            completed_at AS "completedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM
            course_enrollments
          WHERE
            user_id = ${userId}
            AND status = 'active'
            AND (expires_at IS NULL OR expires_at > NOW())
          ORDER BY
            last_accessed_at DESC NULLS LAST
        `,
      });

      // ─────────────────────────────────────────────────────────────────────────
      // Mutations
      // ─────────────────────────────────────────────────────────────────────────

      const create = SqlSchema.single({
        Result: Enrollment,
        Request: InsertEnrollment,
        execute: (input) => sql`
          INSERT INTO course_enrollments ${sql.insert(input)}
          RETURNING
            id,
            user_id AS "userId",
            course_id AS "courseId",
            status,
            source,
            purchase_id AS "purchaseId",
            subscription_id AS "subscriptionId",
            enrolled_at AS "enrolledAt",
            expires_at AS "expiresAt",
            progress_percent AS "progressPercent",
            completed_lesson_count AS "completedLessonCount",
            last_accessed_at AS "lastAccessedAt",
            completed_at AS "completedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
      });

      const update = SqlSchema.single({
        Result: Enrollment,
        Request: UpdateEnrollmentDb,
        execute: (input) => sql`
          UPDATE course_enrollments
          SET
            ${sql.update(input, ['id'])},
            updated_at = NOW()
          WHERE
            id = ${input.id}
          RETURNING
            id,
            user_id AS "userId",
            course_id AS "courseId",
            status,
            source,
            purchase_id AS "purchaseId",
            subscription_id AS "subscriptionId",
            enrolled_at AS "enrolledAt",
            expires_at AS "expiresAt",
            progress_percent AS "progressPercent",
            completed_lesson_count AS "completedLessonCount",
            last_accessed_at AS "lastAccessedAt",
            completed_at AS "completedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
      });

      const updateLastAccessed = SqlSchema.void({
        Request: S.Struct({ id: EnrollmentId }),
        execute: ({ id }) => sql`
          UPDATE course_enrollments
          SET
            last_accessed_at = NOW(),
            updated_at = NOW()
          WHERE
            id = ${id}
        `,
      });

      const markCompleted = SqlSchema.single({
        Result: Enrollment,
        Request: S.Struct({ id: EnrollmentId }),
        execute: ({ id }) => sql`
          UPDATE course_enrollments
          SET
            completed_at = NOW(),
            progress_percent = 100,
            updated_at = NOW()
          WHERE
            id = ${id}
          RETURNING
            id,
            user_id AS "userId",
            course_id AS "courseId",
            status,
            source,
            purchase_id AS "purchaseId",
            subscription_id AS "subscriptionId",
            enrolled_at AS "enrolledAt",
            expires_at AS "expiresAt",
            progress_percent AS "progressPercent",
            completed_lesson_count AS "completedLessonCount",
            last_accessed_at AS "lastAccessedAt",
            completed_at AS "completedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
      });

      const del = SqlSchema.single({
        Result: S.Unknown,
        Request: EnrollmentId,
        execute: (id) => sql`
          DELETE FROM course_enrollments
          WHERE id = ${id}
          RETURNING id
        `,
      });

      // ─────────────────────────────────────────────────────────────────────────
      // Public API
      // ─────────────────────────────────────────────────────────────────────────

      return {
        findByUser: (userId: UserId) => findByUser({ userId }).pipe(Effect.orDie),

        findByCourse: (courseId: CourseId) => findByCourse({ courseId }).pipe(Effect.orDie),

        findActiveByUser: (userId: UserId) => findActiveByUser({ userId }).pipe(Effect.orDie),

        findById: (id: EnrollmentId) =>
          findById({ id }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new EnrollmentNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        findByUserAndCourse: (userId: UserId, courseId: CourseId) =>
          findByUserAndCourse({ userId, courseId }).pipe(
            Effect.catchTag('NoSuchElementException', () => Effect.succeed(null)),
            Effect.catchTags({
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        isEnrolled: (userId: UserId, courseId: CourseId) =>
          findByUserAndCourse({ userId, courseId }).pipe(
            Effect.map((enrollment) => enrollment.status === 'active'),
            Effect.catchTag('NoSuchElementException', () => Effect.succeed(false)),
            Effect.catchTags({
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        create: (input: CreateEnrollmentInput) =>
          create({
            user_id: input.userId,
            course_id: input.courseId,
            status: 'active',
            source: input.source,
            purchase_id: input.purchaseId ?? null,
            subscription_id: input.subscriptionId ?? null,
            expires_at: input.expiresAt ?? null,
          }).pipe(Effect.orDie),

        update: (id: EnrollmentId, input: UpdateEnrollmentInput) =>
          update({
            id,
            ...(input.status !== undefined && { status: input.status }),
            ...(input.expiresAt !== undefined && {
              expires_at: input.expiresAt,
            }),
          }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new EnrollmentNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        updateLastAccessed: (id: EnrollmentId) => updateLastAccessed({ id }).pipe(Effect.orDie),

        markCompleted: (id: EnrollmentId) =>
          markCompleted({ id }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new EnrollmentNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        delete: (id: EnrollmentId) =>
          del(id).pipe(
            Effect.asVoid,
            Effect.catchTags({
              NoSuchElementException: () => new EnrollmentNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),
      } as const;
    }),
  },
) {}
