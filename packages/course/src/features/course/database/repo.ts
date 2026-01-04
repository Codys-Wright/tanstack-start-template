import { PgLive } from '@core/database';
import * as SqlClient from '@effect/sql/SqlClient';
import * as SqlSchema from '@effect/sql/SqlSchema';
import * as Effect from 'effect/Effect';
import { flow } from 'effect/Function';
import * as Schema from 'effect/Schema';

import { CategoryId } from '../../category/domain/schema.js';
import { InstructorId } from '../../instructor/domain/schema.js';
import {
  Course,
  CourseId,
  CourseNotFoundError,
  CourseStatus,
  CreateCourseInput,
  UpdateCourseInput,
} from '../domain/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Internal Input Schemas
// ─────────────────────────────────────────────────────────────────────────────

const InsertCourse = Schema.Struct({
  instructor_id: Schema.UUID,
  title: Schema.String,
  slug: Schema.String,
  subtitle: Schema.NullOr(Schema.String),
  description: Schema.NullOr(Schema.String),
  thumbnail_url: Schema.NullOr(Schema.String),
  preview_video_url: Schema.NullOr(Schema.String),
  category_id: Schema.NullOr(Schema.UUID),
  tags: Schema.NullOr(Schema.String),
  level: Schema.String,
  language: Schema.String,
  pricing: Schema.String,
  requirements: Schema.NullOr(Schema.String),
  learning_outcomes: Schema.NullOr(Schema.String),
  status: CourseStatus,
});

const UpdateCourseDb = Schema.Struct({
  id: CourseId,
  title: Schema.optional(Schema.String),
  slug: Schema.optional(Schema.String),
  subtitle: Schema.optional(Schema.NullOr(Schema.String)),
  description: Schema.optional(Schema.NullOr(Schema.String)),
  thumbnail_url: Schema.optional(Schema.NullOr(Schema.String)),
  preview_video_url: Schema.optional(Schema.NullOr(Schema.String)),
  category_id: Schema.optional(Schema.NullOr(Schema.UUID)),
  tags: Schema.optional(Schema.NullOr(Schema.String)),
  level: Schema.optional(Schema.String),
  language: Schema.optional(Schema.String),
  pricing: Schema.optional(Schema.String),
  requirements: Schema.optional(Schema.NullOr(Schema.String)),
  learning_outcomes: Schema.optional(Schema.NullOr(Schema.String)),
  status: Schema.optional(CourseStatus),
});
type UpdateCourseDb = typeof UpdateCourseDb.Type;

// ─────────────────────────────────────────────────────────────────────────────
// Repository
// ─────────────────────────────────────────────────────────────────────────────

export class CourseRepository extends Effect.Service<CourseRepository>()(
  '@course/CourseRepository',
  {
    dependencies: [PgLive],
    effect: Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      // ─────────────────────────────────────────────────────────────────────────
      // Queries
      // ─────────────────────────────────────────────────────────────────────────

      const findAll = SqlSchema.findAll({
        Result: Course,
        Request: Schema.Void,
        execute: () => sql`
          SELECT
            id,
            instructor_id AS "instructorId",
            title,
            slug,
            subtitle,
            description,
            thumbnail_url AS "thumbnailUrl",
            preview_video_url AS "previewVideoUrl",
            category_id AS "categoryId",
            tags,
            level,
            language,
            pricing,
            requirements,
            learning_outcomes AS "learningOutcomes",
            total_duration_minutes AS "totalDurationMinutes",
            lesson_count AS "lessonCount",
            section_count AS "sectionCount",
            enrollment_count AS "enrollmentCount",
            average_rating AS "averageRating",
            review_count AS "reviewCount",
            status,
            published_at AS "publishedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt",
            deleted_at AS "deletedAt"
          FROM
            courses
          WHERE
            deleted_at IS NULL
          ORDER BY
            created_at DESC
        `,
      });

      const findById = SqlSchema.single({
        Result: Course,
        Request: Schema.Struct({ id: CourseId }),
        execute: ({ id }) => sql`
          SELECT
            id,
            instructor_id AS "instructorId",
            title,
            slug,
            subtitle,
            description,
            thumbnail_url AS "thumbnailUrl",
            preview_video_url AS "previewVideoUrl",
            category_id AS "categoryId",
            tags,
            level,
            language,
            pricing,
            requirements,
            learning_outcomes AS "learningOutcomes",
            total_duration_minutes AS "totalDurationMinutes",
            lesson_count AS "lessonCount",
            section_count AS "sectionCount",
            enrollment_count AS "enrollmentCount",
            average_rating AS "averageRating",
            review_count AS "reviewCount",
            status,
            published_at AS "publishedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt",
            deleted_at AS "deletedAt"
          FROM
            courses
          WHERE
            id = ${id}
            AND deleted_at IS NULL
        `,
      });

      const findBySlug = SqlSchema.single({
        Result: Course,
        Request: Schema.Struct({ slug: Schema.String }),
        execute: ({ slug }) => sql`
          SELECT
            id,
            instructor_id AS "instructorId",
            title,
            slug,
            subtitle,
            description,
            thumbnail_url AS "thumbnailUrl",
            preview_video_url AS "previewVideoUrl",
            category_id AS "categoryId",
            tags,
            level,
            language,
            pricing,
            requirements,
            learning_outcomes AS "learningOutcomes",
            total_duration_minutes AS "totalDurationMinutes",
            lesson_count AS "lessonCount",
            section_count AS "sectionCount",
            enrollment_count AS "enrollmentCount",
            average_rating AS "averageRating",
            review_count AS "reviewCount",
            status,
            published_at AS "publishedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt",
            deleted_at AS "deletedAt"
          FROM
            courses
          WHERE
            slug = ${slug}
            AND deleted_at IS NULL
        `,
      });

      const findByInstructor = SqlSchema.findAll({
        Result: Course,
        Request: Schema.Struct({ instructorId: InstructorId }),
        execute: ({ instructorId }) => sql`
          SELECT
            id,
            instructor_id AS "instructorId",
            title,
            slug,
            subtitle,
            description,
            thumbnail_url AS "thumbnailUrl",
            preview_video_url AS "previewVideoUrl",
            category_id AS "categoryId",
            tags,
            level,
            language,
            pricing,
            requirements,
            learning_outcomes AS "learningOutcomes",
            total_duration_minutes AS "totalDurationMinutes",
            lesson_count AS "lessonCount",
            section_count AS "sectionCount",
            enrollment_count AS "enrollmentCount",
            average_rating AS "averageRating",
            review_count AS "reviewCount",
            status,
            published_at AS "publishedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt",
            deleted_at AS "deletedAt"
          FROM
            courses
          WHERE
            instructor_id = ${instructorId}
            AND deleted_at IS NULL
          ORDER BY
            created_at DESC
        `,
      });

      const findByCategory = SqlSchema.findAll({
        Result: Course,
        Request: Schema.Struct({ categoryId: CategoryId }),
        execute: ({ categoryId }) => sql`
          SELECT
            id,
            instructor_id AS "instructorId",
            title,
            slug,
            subtitle,
            description,
            thumbnail_url AS "thumbnailUrl",
            preview_video_url AS "previewVideoUrl",
            category_id AS "categoryId",
            tags,
            level,
            language,
            pricing,
            requirements,
            learning_outcomes AS "learningOutcomes",
            total_duration_minutes AS "totalDurationMinutes",
            lesson_count AS "lessonCount",
            section_count AS "sectionCount",
            enrollment_count AS "enrollmentCount",
            average_rating AS "averageRating",
            review_count AS "reviewCount",
            status,
            published_at AS "publishedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt",
            deleted_at AS "deletedAt"
          FROM
            courses
          WHERE
            category_id = ${categoryId}
            AND status = 'published'
            AND deleted_at IS NULL
          ORDER BY
            enrollment_count DESC
        `,
      });

      const findPublished = SqlSchema.findAll({
        Result: Course,
        Request: Schema.Void,
        execute: () => sql`
          SELECT
            id,
            instructor_id AS "instructorId",
            title,
            slug,
            subtitle,
            description,
            thumbnail_url AS "thumbnailUrl",
            preview_video_url AS "previewVideoUrl",
            category_id AS "categoryId",
            tags,
            level,
            language,
            pricing,
            requirements,
            learning_outcomes AS "learningOutcomes",
            total_duration_minutes AS "totalDurationMinutes",
            lesson_count AS "lessonCount",
            section_count AS "sectionCount",
            enrollment_count AS "enrollmentCount",
            average_rating AS "averageRating",
            review_count AS "reviewCount",
            status,
            published_at AS "publishedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt",
            deleted_at AS "deletedAt"
          FROM
            courses
          WHERE
            status = 'published'
            AND deleted_at IS NULL
          ORDER BY
            published_at DESC
        `,
      });

      // ─────────────────────────────────────────────────────────────────────────
      // Mutations
      // ─────────────────────────────────────────────────────────────────────────

      const create = SqlSchema.single({
        Result: Course,
        Request: InsertCourse,
        execute: (input) => sql`
          INSERT INTO courses ${sql.insert(input)}
          RETURNING
            id,
            instructor_id AS "instructorId",
            title,
            slug,
            subtitle,
            description,
            thumbnail_url AS "thumbnailUrl",
            preview_video_url AS "previewVideoUrl",
            category_id AS "categoryId",
            tags,
            level,
            language,
            pricing,
            requirements,
            learning_outcomes AS "learningOutcomes",
            total_duration_minutes AS "totalDurationMinutes",
            lesson_count AS "lessonCount",
            section_count AS "sectionCount",
            enrollment_count AS "enrollmentCount",
            average_rating AS "averageRating",
            review_count AS "reviewCount",
            status,
            published_at AS "publishedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt",
            deleted_at AS "deletedAt"
        `,
      });

      const update = SqlSchema.single({
        Result: Course,
        Request: UpdateCourseDb,
        execute: (input) => sql`
          UPDATE courses
          SET
            ${sql.update(input, ['id'])},
            updated_at = NOW()
          WHERE
            id = ${input.id}
            AND deleted_at IS NULL
          RETURNING
            id,
            instructor_id AS "instructorId",
            title,
            slug,
            subtitle,
            description,
            thumbnail_url AS "thumbnailUrl",
            preview_video_url AS "previewVideoUrl",
            category_id AS "categoryId",
            tags,
            level,
            language,
            pricing,
            requirements,
            learning_outcomes AS "learningOutcomes",
            total_duration_minutes AS "totalDurationMinutes",
            lesson_count AS "lessonCount",
            section_count AS "sectionCount",
            enrollment_count AS "enrollmentCount",
            average_rating AS "averageRating",
            review_count AS "reviewCount",
            status,
            published_at AS "publishedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt",
            deleted_at AS "deletedAt"
        `,
      });

      const publish = SqlSchema.single({
        Result: Course,
        Request: Schema.Struct({ id: CourseId }),
        execute: ({ id }) => sql`
          UPDATE courses
          SET
            status = 'published',
            published_at = NOW(),
            updated_at = NOW()
          WHERE
            id = ${id}
            AND deleted_at IS NULL
          RETURNING
            id,
            instructor_id AS "instructorId",
            title,
            slug,
            subtitle,
            description,
            thumbnail_url AS "thumbnailUrl",
            preview_video_url AS "previewVideoUrl",
            category_id AS "categoryId",
            tags,
            level,
            language,
            pricing,
            requirements,
            learning_outcomes AS "learningOutcomes",
            total_duration_minutes AS "totalDurationMinutes",
            lesson_count AS "lessonCount",
            section_count AS "sectionCount",
            enrollment_count AS "enrollmentCount",
            average_rating AS "averageRating",
            review_count AS "reviewCount",
            status,
            published_at AS "publishedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt",
            deleted_at AS "deletedAt"
        `,
      });

      const archive = SqlSchema.single({
        Result: Course,
        Request: Schema.Struct({ id: CourseId }),
        execute: ({ id }) => sql`
          UPDATE courses
          SET
            status = 'archived',
            updated_at = NOW()
          WHERE
            id = ${id}
            AND deleted_at IS NULL
          RETURNING
            id,
            instructor_id AS "instructorId",
            title,
            slug,
            subtitle,
            description,
            thumbnail_url AS "thumbnailUrl",
            preview_video_url AS "previewVideoUrl",
            category_id AS "categoryId",
            tags,
            level,
            language,
            pricing,
            requirements,
            learning_outcomes AS "learningOutcomes",
            total_duration_minutes AS "totalDurationMinutes",
            lesson_count AS "lessonCount",
            section_count AS "sectionCount",
            enrollment_count AS "enrollmentCount",
            average_rating AS "averageRating",
            review_count AS "reviewCount",
            status,
            published_at AS "publishedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt",
            deleted_at AS "deletedAt"
        `,
      });

      const del = SqlSchema.single({
        Result: Schema.Unknown,
        Request: CourseId,
        execute: (id) => sql`
          UPDATE courses
          SET
            deleted_at = NOW(),
            updated_at = NOW()
          WHERE
            id = ${id}
            AND deleted_at IS NULL
          RETURNING id
        `,
      });

      // ─────────────────────────────────────────────────────────────────────────
      // Slug generation helper
      // ─────────────────────────────────────────────────────────────────────────

      const generateSlug = (title: string): string => {
        return title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      };

      // ─────────────────────────────────────────────────────────────────────────
      // Public API
      // ─────────────────────────────────────────────────────────────────────────

      return {
        findAll: flow(findAll, Effect.orDie),

        findPublished: flow(findPublished, Effect.orDie),

        findByInstructor: (instructorId: InstructorId) =>
          findByInstructor({ instructorId }).pipe(Effect.orDie),

        findByCategory: (categoryId: CategoryId) =>
          findByCategory({ categoryId }).pipe(Effect.orDie),

        findById: (id: CourseId) =>
          findById({ id }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new CourseNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        findBySlug: (slug: string) =>
          findBySlug({ slug }).pipe(
            Effect.catchTags({
              NoSuchElementException: () =>
                Effect.fail(new CourseNotFoundError({ id: slug as CourseId })),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        create: (input: CreateCourseInput) =>
          create({
            instructor_id: input.instructorId,
            title: input.title,
            slug: input.slug ?? generateSlug(input.title),
            subtitle: input.subtitle ?? null,
            description: input.description ?? null,
            thumbnail_url: input.thumbnailUrl ?? null,
            preview_video_url: input.previewVideoUrl ?? null,
            category_id: input.categoryId ?? null,
            tags: input.tags ? JSON.stringify(input.tags) : null,
            level: input.level ?? 'all-levels',
            language: input.language ?? 'en',
            pricing: JSON.stringify(input.pricing ?? { model: 'free' }),
            requirements: input.requirements ? JSON.stringify(input.requirements) : null,
            learning_outcomes: input.learningOutcomes
              ? JSON.stringify(input.learningOutcomes)
              : null,
            status: 'draft',
          }).pipe(Effect.orDie),

        update: (id: CourseId, input: UpdateCourseInput) =>
          update({
            id,
            ...(input.title !== undefined && { title: input.title }),
            ...(input.slug !== undefined && { slug: input.slug }),
            ...(input.subtitle !== undefined && { subtitle: input.subtitle }),
            ...(input.description !== undefined && {
              description: input.description,
            }),
            ...(input.thumbnailUrl !== undefined && {
              thumbnail_url: input.thumbnailUrl,
            }),
            ...(input.previewVideoUrl !== undefined && {
              preview_video_url: input.previewVideoUrl,
            }),
            ...(input.categoryId !== undefined && {
              category_id: input.categoryId,
            }),
            ...(input.tags !== undefined && {
              tags: JSON.stringify(input.tags),
            }),
            ...(input.level !== undefined && { level: input.level }),
            ...(input.language !== undefined && { language: input.language }),
            ...(input.pricing !== undefined && {
              pricing: JSON.stringify(input.pricing),
            }),
            ...(input.requirements !== undefined && {
              requirements: JSON.stringify(input.requirements),
            }),
            ...(input.learningOutcomes !== undefined && {
              learning_outcomes: JSON.stringify(input.learningOutcomes),
            }),
            ...(input.status !== undefined && { status: input.status }),
          }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new CourseNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        publish: (id: CourseId) =>
          publish({ id }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new CourseNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        archive: (id: CourseId) =>
          archive({ id }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new CourseNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        delete: (id: CourseId) =>
          del(id).pipe(
            Effect.asVoid,
            Effect.catchTags({
              NoSuchElementException: () => new CourseNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),
      } as const;
    }),
  },
) {}
