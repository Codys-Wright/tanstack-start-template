import { UserId } from '@auth';
import { PgLive } from '@core/database';
import * as SqlClient from '@effect/sql/SqlClient';
import * as SqlSchema from '@effect/sql/SqlSchema';
import * as Effect from 'effect/Effect';
import * as S from 'effect/Schema';

import { CourseId } from '../../course/domain/schema.js';
import { EnrollmentId } from '../../enrollment/domain/schema.js';
import {
  CreateReviewInput,
  Review,
  ReviewId,
  ReviewNotFoundError,
  UpdateReviewInput,
} from '../domain/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Internal Input Schemas
// ─────────────────────────────────────────────────────────────────────────────

const InsertReview = S.Struct({
  course_id: S.UUID,
  user_id: UserId,
  enrollment_id: S.UUID,
  rating: S.Number,
  title: S.NullOr(S.String),
  body: S.NullOr(S.String),
});

const UpdateReviewDb = S.Struct({
  id: ReviewId,
  rating: S.optional(S.Number),
  title: S.optional(S.NullOr(S.String)),
  body: S.optional(S.NullOr(S.String)),
});
type UpdateReviewDb = typeof UpdateReviewDb.Type;

// ─────────────────────────────────────────────────────────────────────────────
// Repository
// ─────────────────────────────────────────────────────────────────────────────

export class ReviewRepository extends Effect.Service<ReviewRepository>()(
  '@course/ReviewRepository',
  {
    dependencies: [PgLive],
    effect: Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      // ─────────────────────────────────────────────────────────────────────────
      // Queries
      // ─────────────────────────────────────────────────────────────────────────

      const findById = SqlSchema.single({
        Result: Review,
        Request: S.Struct({ id: ReviewId }),
        execute: ({ id }) => sql`
        SELECT
          id,
          course_id AS "courseId",
          user_id AS "userId",
          enrollment_id AS "enrollmentId",
          rating,
          title,
          body,
          instructor_response AS "instructorResponse",
          responded_at AS "respondedAt",
          is_approved AS "isApproved",
          is_featured AS "isFeatured",
          helpful_count AS "helpfulCount",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM
          course_reviews
        WHERE
          id = ${id}
      `,
      });

      const findByUserAndCourse = SqlSchema.single({
        Result: Review,
        Request: S.Struct({ userId: UserId, courseId: CourseId }),
        execute: ({ userId, courseId }) => sql`
        SELECT
          id,
          course_id AS "courseId",
          user_id AS "userId",
          enrollment_id AS "enrollmentId",
          rating,
          title,
          body,
          instructor_response AS "instructorResponse",
          responded_at AS "respondedAt",
          is_approved AS "isApproved",
          is_featured AS "isFeatured",
          helpful_count AS "helpfulCount",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM
          course_reviews
        WHERE
          user_id = ${userId}
          AND course_id = ${courseId}
      `,
      });

      const findByCourse = SqlSchema.findAll({
        Result: Review,
        Request: S.Struct({ courseId: CourseId }),
        execute: ({ courseId }) => sql`
        SELECT
          id,
          course_id AS "courseId",
          user_id AS "userId",
          enrollment_id AS "enrollmentId",
          rating,
          title,
          body,
          instructor_response AS "instructorResponse",
          responded_at AS "respondedAt",
          is_approved AS "isApproved",
          is_featured AS "isFeatured",
          helpful_count AS "helpfulCount",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM
          course_reviews
        WHERE
          course_id = ${courseId}
          AND is_approved = true
        ORDER BY
          created_at DESC
      `,
      });

      const findApprovedByCourse = SqlSchema.findAll({
        Result: Review,
        Request: S.Struct({ courseId: CourseId }),
        execute: ({ courseId }) => sql`
        SELECT
          id,
          course_id AS "courseId",
          user_id AS "userId",
          enrollment_id AS "enrollmentId",
          rating,
          title,
          body,
          instructor_response AS "instructorResponse",
          responded_at AS "respondedAt",
          is_approved AS "isApproved",
          is_featured AS "isFeatured",
          helpful_count AS "helpfulCount",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM
          course_reviews
        WHERE
          course_id = ${courseId}
          AND is_approved = true
        ORDER BY
          helpful_count DESC, created_at DESC
      `,
      });

      const findFeaturedByCourse = SqlSchema.findAll({
        Result: Review,
        Request: S.Struct({ courseId: CourseId }),
        execute: ({ courseId }) => sql`
        SELECT
          id,
          course_id AS "courseId",
          user_id AS "userId",
          enrollment_id AS "enrollmentId",
          rating,
          title,
          body,
          instructor_response AS "instructorResponse",
          responded_at AS "respondedAt",
          is_approved AS "isApproved",
          is_featured AS "isFeatured",
          helpful_count AS "helpfulCount",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM
          course_reviews
        WHERE
          course_id = ${courseId}
          AND is_featured = true
        ORDER BY
          created_at DESC
      `,
      });

      const findByUser = SqlSchema.findAll({
        Result: Review,
        Request: S.Struct({ userId: UserId }),
        execute: ({ userId }) => sql`
        SELECT
          id,
          course_id AS "courseId",
          user_id AS "userId",
          enrollment_id AS "enrollmentId",
          rating,
          title,
          body,
          instructor_response AS "instructorResponse",
          responded_at AS "respondedAt",
          is_approved AS "isApproved",
          is_featured AS "isFeatured",
          helpful_count AS "helpfulCount",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM
          course_reviews
        WHERE
          user_id = ${userId}
        ORDER BY
          created_at DESC
      `,
      });

      // ─────────────────────────────────────────────────────────────────────────
      // Mutations
      // ─────────────────────────────────────────────────────────────────────────

      const create = SqlSchema.single({
        Result: Review,
        Request: InsertReview,
        execute: (input) => sql`
        INSERT INTO course_reviews ${sql.insert(input)}
        RETURNING
          id,
          course_id AS "courseId",
          user_id AS "userId",
          enrollment_id AS "enrollmentId",
          rating,
          title,
          body,
          instructor_response AS "instructorResponse",
          responded_at AS "respondedAt",
          is_approved AS "isApproved",
          is_featured AS "isFeatured",
          helpful_count AS "helpfulCount",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      });

      const update = SqlSchema.single({
        Result: Review,
        Request: UpdateReviewDb,
        execute: (input) => sql`
        UPDATE course_reviews
        SET
          ${sql.update(input, ['id'])},
          updated_at = NOW()
        WHERE
          id = ${input.id}
        RETURNING
          id,
          course_id AS "courseId",
          user_id AS "userId",
          enrollment_id AS "enrollmentId",
          rating,
          title,
          body,
          instructor_response AS "instructorResponse",
          responded_at AS "respondedAt",
          is_approved AS "isApproved",
          is_featured AS "isFeatured",
          helpful_count AS "helpfulCount",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      });

      const addInstructorResponse = SqlSchema.single({
        Result: Review,
        Request: S.Struct({ id: ReviewId, response: S.String }),
        execute: ({ id, response }) => sql`
        UPDATE course_reviews
        SET
          instructor_response = ${response},
          responded_at = NOW(),
          updated_at = NOW()
        WHERE
          id = ${id}
        RETURNING
          id,
          course_id AS "courseId",
          user_id AS "userId",
          enrollment_id AS "enrollmentId",
          rating,
          title,
          body,
          instructor_response AS "instructorResponse",
          responded_at AS "respondedAt",
          is_approved AS "isApproved",
          is_featured AS "isFeatured",
          helpful_count AS "helpfulCount",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      });

      const approve = SqlSchema.single({
        Result: Review,
        Request: S.Struct({ id: ReviewId }),
        execute: ({ id }) => sql`
        UPDATE course_reviews
        SET
          is_approved = true,
          updated_at = NOW()
        WHERE
          id = ${id}
        RETURNING
          id,
          course_id AS "courseId",
          user_id AS "userId",
          enrollment_id AS "enrollmentId",
          rating,
          title,
          body,
          instructor_response AS "instructorResponse",
          responded_at AS "respondedAt",
          is_approved AS "isApproved",
          is_featured AS "isFeatured",
          helpful_count AS "helpfulCount",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      });

      const feature = SqlSchema.single({
        Result: Review,
        Request: S.Struct({ id: ReviewId, featured: S.Boolean }),
        execute: ({ id, featured }) => sql`
        UPDATE course_reviews
        SET
          is_featured = ${featured},
          updated_at = NOW()
        WHERE
          id = ${id}
        RETURNING
          id,
          course_id AS "courseId",
          user_id AS "userId",
          enrollment_id AS "enrollmentId",
          rating,
          title,
          body,
          instructor_response AS "instructorResponse",
          responded_at AS "respondedAt",
          is_approved AS "isApproved",
          is_featured AS "isFeatured",
          helpful_count AS "helpfulCount",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      });

      const incrementHelpful = SqlSchema.void({
        Request: S.Struct({ id: ReviewId }),
        execute: ({ id }) => sql`
        UPDATE course_reviews
        SET
          helpful_count = helpful_count + 1,
          updated_at = NOW()
        WHERE
          id = ${id}
      `,
      });

      const del = SqlSchema.single({
        Result: S.Unknown,
        Request: ReviewId,
        execute: (id) => sql`
        DELETE FROM course_reviews
        WHERE id = ${id}
        RETURNING id
      `,
      });

      // ─────────────────────────────────────────────────────────────────────────
      // Public API
      // ─────────────────────────────────────────────────────────────────────────

      return {
        findByCourse: (courseId: CourseId) => findByCourse({ courseId }).pipe(Effect.orDie),

        findApprovedByCourse: (courseId: CourseId) =>
          findApprovedByCourse({ courseId }).pipe(Effect.orDie),

        findFeaturedByCourse: (courseId: CourseId) =>
          findFeaturedByCourse({ courseId }).pipe(Effect.orDie),

        findByUser: (userId: UserId) => findByUser({ userId }).pipe(Effect.orDie),

        findById: (id: ReviewId) =>
          findById({ id }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new ReviewNotFoundError({ id }),
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

        create: (input: CreateReviewInput, userId: UserId, enrollmentId: EnrollmentId) =>
          create({
            course_id: input.courseId,
            user_id: userId,
            enrollment_id: enrollmentId,
            rating: input.rating,
            title: input.title ?? null,
            body: input.body ?? null,
          }).pipe(Effect.orDie),

        update: (id: ReviewId, input: UpdateReviewInput) =>
          update({
            id,
            ...(input.rating !== undefined && { rating: input.rating }),
            ...(input.title !== undefined && { title: input.title }),
            ...(input.body !== undefined && { body: input.body }),
          }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new ReviewNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        addInstructorResponse: (id: ReviewId, response: string) =>
          addInstructorResponse({ id, response }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new ReviewNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        approve: (id: ReviewId) =>
          approve({ id }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new ReviewNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        setFeatured: (id: ReviewId, featured: boolean) =>
          feature({ id, featured }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new ReviewNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        incrementHelpful: (id: ReviewId) => incrementHelpful({ id }).pipe(Effect.orDie),

        delete: (id: ReviewId) =>
          del(id).pipe(
            Effect.asVoid,
            Effect.catchTags({
              NoSuchElementException: () => new ReviewNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),
      } as const;
    }),
  },
) {}
