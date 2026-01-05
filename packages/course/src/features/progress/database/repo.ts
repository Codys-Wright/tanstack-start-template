import { UserId } from '@auth';
import { PgLive } from '@core/database';
import * as SqlClient from '@effect/sql/SqlClient';
import * as SqlSchema from '@effect/sql/SqlSchema';
import * as Effect from 'effect/Effect';
import * as S from 'effect/Schema';

import { CourseId } from '../../course/domain/schema.js';
import { EnrollmentId } from '../../enrollment/domain/schema.js';
import { LessonId } from '../../lesson/domain/schema.js';
import {
  LessonProgress,
  ProgressId,
  ProgressNotFoundError,
  ProgressStatus,
  UpdateProgressInput,
} from '../domain/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Internal Input Schemas
// ─────────────────────────────────────────────────────────────────────────────

const InsertProgress = S.Struct({
  user_id: UserId,
  lesson_id: S.UUID,
  course_id: S.UUID,
  enrollment_id: S.UUID,
  status: ProgressStatus,
});

const UpdateProgressDb = S.Struct({
  id: ProgressId,
  status: S.optional(ProgressStatus),
  watched_seconds: S.optional(S.Number),
  last_position: S.optional(S.Number),
  quiz_attempt_id: S.optional(S.NullOr(S.String)),
  quiz_score: S.optional(S.NullOr(S.Number)),
  quiz_passed: S.optional(S.NullOr(S.Boolean)),
});
type UpdateProgressDb = typeof UpdateProgressDb.Type;

// ─────────────────────────────────────────────────────────────────────────────
// Repository
// ─────────────────────────────────────────────────────────────────────────────

export class ProgressRepository extends Effect.Service<ProgressRepository>()(
  '@course/ProgressRepository',
  {
    dependencies: [PgLive],
    effect: Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      // ─────────────────────────────────────────────────────────────────────────
      // Queries
      // ─────────────────────────────────────────────────────────────────────────

      const findById = SqlSchema.single({
        Result: LessonProgress,
        Request: S.Struct({ id: ProgressId }),
        execute: ({ id }) => sql`
          SELECT
            id,
            user_id AS "userId",
            lesson_id AS "lessonId",
            course_id AS "courseId",
            enrollment_id AS "enrollmentId",
            status,
            watched_seconds AS "watchedSeconds",
            last_position AS "lastPosition",
            quiz_attempt_id AS "quizAttemptId",
            quiz_score AS "quizScore",
            quiz_passed AS "quizPassed",
            started_at AS "startedAt",
            completed_at AS "completedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM
            lesson_progress
          WHERE
            id = ${id}
        `,
      });

      const findByUserAndLesson = SqlSchema.single({
        Result: LessonProgress,
        Request: S.Struct({ userId: UserId, lessonId: LessonId }),
        execute: ({ userId, lessonId }) => sql`
          SELECT
            id,
            user_id AS "userId",
            lesson_id AS "lessonId",
            course_id AS "courseId",
            enrollment_id AS "enrollmentId",
            status,
            watched_seconds AS "watchedSeconds",
            last_position AS "lastPosition",
            quiz_attempt_id AS "quizAttemptId",
            quiz_score AS "quizScore",
            quiz_passed AS "quizPassed",
            started_at AS "startedAt",
            completed_at AS "completedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM
            lesson_progress
          WHERE
            user_id = ${userId}
            AND lesson_id = ${lessonId}
        `,
      });

      const findByEnrollment = SqlSchema.findAll({
        Result: LessonProgress,
        Request: S.Struct({ enrollmentId: EnrollmentId }),
        execute: ({ enrollmentId }) => sql`
          SELECT
            id,
            user_id AS "userId",
            lesson_id AS "lessonId",
            course_id AS "courseId",
            enrollment_id AS "enrollmentId",
            status,
            watched_seconds AS "watchedSeconds",
            last_position AS "lastPosition",
            quiz_attempt_id AS "quizAttemptId",
            quiz_score AS "quizScore",
            quiz_passed AS "quizPassed",
            started_at AS "startedAt",
            completed_at AS "completedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM
            lesson_progress
          WHERE
            enrollment_id = ${enrollmentId}
          ORDER BY
            created_at ASC
        `,
      });

      const findByUserAndCourse = SqlSchema.findAll({
        Result: LessonProgress,
        Request: S.Struct({ userId: UserId, courseId: CourseId }),
        execute: ({ userId, courseId }) => sql`
          SELECT
            id,
            user_id AS "userId",
            lesson_id AS "lessonId",
            course_id AS "courseId",
            enrollment_id AS "enrollmentId",
            status,
            watched_seconds AS "watchedSeconds",
            last_position AS "lastPosition",
            quiz_attempt_id AS "quizAttemptId",
            quiz_score AS "quizScore",
            quiz_passed AS "quizPassed",
            started_at AS "startedAt",
            completed_at AS "completedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM
            lesson_progress
          WHERE
            user_id = ${userId}
            AND course_id = ${courseId}
          ORDER BY
            created_at ASC
        `,
      });

      const countCompletedByEnrollment = SqlSchema.single({
        Result: S.Struct({ count: S.Number }),
        Request: S.Struct({ enrollmentId: EnrollmentId }),
        execute: ({ enrollmentId }) => sql`
          SELECT COUNT(*)::int AS count
          FROM lesson_progress
          WHERE enrollment_id = ${enrollmentId}
            AND status = 'completed'
        `,
      });

      // ─────────────────────────────────────────────────────────────────────────
      // Mutations
      // ─────────────────────────────────────────────────────────────────────────

      const create = SqlSchema.single({
        Result: LessonProgress,
        Request: InsertProgress,
        execute: (input) => sql`
          INSERT INTO lesson_progress ${sql.insert(input)}
          RETURNING
            id,
            user_id AS "userId",
            lesson_id AS "lessonId",
            course_id AS "courseId",
            enrollment_id AS "enrollmentId",
            status,
            watched_seconds AS "watchedSeconds",
            last_position AS "lastPosition",
            quiz_attempt_id AS "quizAttemptId",
            quiz_score AS "quizScore",
            quiz_passed AS "quizPassed",
            started_at AS "startedAt",
            completed_at AS "completedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
      });

      const update = SqlSchema.single({
        Result: LessonProgress,
        Request: UpdateProgressDb,
        execute: (input) => sql`
          UPDATE lesson_progress
          SET
            ${sql.update(input, ['id'])},
            updated_at = NOW()
          WHERE
            id = ${input.id}
          RETURNING
            id,
            user_id AS "userId",
            lesson_id AS "lessonId",
            course_id AS "courseId",
            enrollment_id AS "enrollmentId",
            status,
            watched_seconds AS "watchedSeconds",
            last_position AS "lastPosition",
            quiz_attempt_id AS "quizAttemptId",
            quiz_score AS "quizScore",
            quiz_passed AS "quizPassed",
            started_at AS "startedAt",
            completed_at AS "completedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
      });

      const markStarted = SqlSchema.single({
        Result: LessonProgress,
        Request: S.Struct({ id: ProgressId }),
        execute: ({ id }) => sql`
          UPDATE lesson_progress
          SET
            status = 'in_progress',
            started_at = COALESCE(started_at, NOW()),
            updated_at = NOW()
          WHERE
            id = ${id}
          RETURNING
            id,
            user_id AS "userId",
            lesson_id AS "lessonId",
            course_id AS "courseId",
            enrollment_id AS "enrollmentId",
            status,
            watched_seconds AS "watchedSeconds",
            last_position AS "lastPosition",
            quiz_attempt_id AS "quizAttemptId",
            quiz_score AS "quizScore",
            quiz_passed AS "quizPassed",
            started_at AS "startedAt",
            completed_at AS "completedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
      });

      const markCompleted = SqlSchema.single({
        Result: LessonProgress,
        Request: S.Struct({ id: ProgressId }),
        execute: ({ id }) => sql`
          UPDATE lesson_progress
          SET
            status = 'completed',
            completed_at = NOW(),
            updated_at = NOW()
          WHERE
            id = ${id}
          RETURNING
            id,
            user_id AS "userId",
            lesson_id AS "lessonId",
            course_id AS "courseId",
            enrollment_id AS "enrollmentId",
            status,
            watched_seconds AS "watchedSeconds",
            last_position AS "lastPosition",
            quiz_attempt_id AS "quizAttemptId",
            quiz_score AS "quizScore",
            quiz_passed AS "quizPassed",
            started_at AS "startedAt",
            completed_at AS "completedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
      });

      const del = SqlSchema.single({
        Result: S.Unknown,
        Request: ProgressId,
        execute: (id) => sql`
          DELETE FROM lesson_progress
          WHERE id = ${id}
          RETURNING id
        `,
      });

      // ─────────────────────────────────────────────────────────────────────────
      // Public API
      // ─────────────────────────────────────────────────────────────────────────

      return {
        findByEnrollment: (enrollmentId: EnrollmentId) =>
          findByEnrollment({ enrollmentId }).pipe(Effect.orDie),

        findByUserAndCourse: (userId: UserId, courseId: CourseId) =>
          findByUserAndCourse({ userId, courseId }).pipe(Effect.orDie),

        countCompletedByEnrollment: (enrollmentId: EnrollmentId) =>
          countCompletedByEnrollment({ enrollmentId }).pipe(
            Effect.map((r) => r.count),
            Effect.orDie,
          ),

        findById: (id: ProgressId) =>
          findById({ id }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new ProgressNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        findByUserAndLesson: (userId: UserId, lessonId: LessonId) =>
          findByUserAndLesson({ userId, lessonId }).pipe(
            Effect.catchTag('NoSuchElementException', () => Effect.succeed(null)),
            Effect.catchTags({
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        getOrCreate: (
          userId: UserId,
          lessonId: LessonId,
          courseId: CourseId,
          enrollmentId: EnrollmentId,
        ) =>
          findByUserAndLesson({ userId, lessonId }).pipe(
            Effect.catchTag('NoSuchElementException', () =>
              create({
                user_id: userId,
                lesson_id: lessonId,
                course_id: courseId,
                enrollment_id: enrollmentId,
                status: 'not_started',
              }),
            ),
            Effect.orDie,
          ),

        update: (id: ProgressId, input: UpdateProgressInput) =>
          update({
            id,
            ...(input.status !== undefined && { status: input.status }),
            ...(input.watchedSeconds !== undefined && {
              watched_seconds: input.watchedSeconds,
            }),
            ...(input.lastPosition !== undefined && {
              last_position: input.lastPosition,
            }),
            ...(input.quizAttemptId !== undefined && {
              quiz_attempt_id: input.quizAttemptId,
            }),
            ...(input.quizScore !== undefined && {
              quiz_score: input.quizScore,
            }),
            ...(input.quizPassed !== undefined && {
              quiz_passed: input.quizPassed,
            }),
          }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new ProgressNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        markStarted: (id: ProgressId) =>
          markStarted({ id }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new ProgressNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        markCompleted: (id: ProgressId) =>
          markCompleted({ id }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new ProgressNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        delete: (id: ProgressId) =>
          del(id).pipe(
            Effect.asVoid,
            Effect.catchTags({
              NoSuchElementException: () => new ProgressNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),
      } as const;
    }),
  },
) {}
