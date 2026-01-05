import { PgLive } from '@core/database';
import * as SqlClient from '@effect/sql/SqlClient';
import * as SqlSchema from '@effect/sql/SqlSchema';
import * as Effect from 'effect/Effect';
import * as S from 'effect/Schema';

import { CourseId } from '../../course/domain/schema.js';
import { SectionId } from '../../section/domain/schema.js';
import {
  CreateLessonInput,
  Lesson,
  LessonId,
  LessonNotFoundError,
  LessonType,
  UpdateLessonInput,
} from '../domain/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Internal Input Schemas
// ─────────────────────────────────────────────────────────────────────────────

const InsertLesson = S.Struct({
  section_id: S.UUID,
  course_id: S.UUID,
  title: S.String,
  description: S.NullOr(S.String),
  type: LessonType,
  mdx_content: S.NullOr(S.String),
  video_content: S.NullOr(S.String),
  quiz_id: S.NullOr(S.UUID),
  quiz_passing_score: S.NullOr(S.Number),
  quiz_is_required: S.Boolean,
  download_files: S.NullOr(S.String),
  sort_order: S.Number,
  duration_minutes: S.Number,
  is_free: S.Boolean,
  is_preview: S.Boolean,
});

const UpdateLessonDb = S.Struct({
  id: LessonId,
  title: S.optional(S.String),
  description: S.optional(S.NullOr(S.String)),
  type: S.optional(LessonType),
  mdx_content: S.optional(S.NullOr(S.String)),
  video_content: S.optional(S.NullOr(S.String)),
  quiz_id: S.optional(S.NullOr(S.UUID)),
  quiz_passing_score: S.optional(S.NullOr(S.Number)),
  quiz_is_required: S.optional(S.Boolean),
  download_files: S.optional(S.NullOr(S.String)),
  sort_order: S.optional(S.Number),
  duration_minutes: S.optional(S.Number),
  is_free: S.optional(S.Boolean),
  is_preview: S.optional(S.Boolean),
});
type UpdateLessonDb = typeof UpdateLessonDb.Type;

// ─────────────────────────────────────────────────────────────────────────────
// Repository
// ─────────────────────────────────────────────────────────────────────────────

export class LessonRepository extends Effect.Service<LessonRepository>()(
  '@course/LessonRepository',
  {
    dependencies: [PgLive],
    effect: Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      // ─────────────────────────────────────────────────────────────────────────
      // Queries
      // ─────────────────────────────────────────────────────────────────────────

      const findById = SqlSchema.single({
        Result: Lesson,
        Request: S.Struct({ id: LessonId }),
        execute: ({ id }) => sql`
        SELECT
          id,
          section_id AS "sectionId",
          course_id AS "courseId",
          title,
          description,
          type,
          mdx_content AS "mdxContent",
          video_content AS "videoContent",
          quiz_id AS "quizId",
          quiz_passing_score AS "quizPassingScore",
          quiz_is_required AS "quizIsRequired",
          download_files AS "downloadFiles",
          sort_order AS "sortOrder",
          duration_minutes AS "durationMinutes",
          is_free AS "isFree",
          is_preview AS "isPreview",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM
          course_lessons
        WHERE
          id = ${id}
      `,
      });

      const findBySection = SqlSchema.findAll({
        Result: Lesson,
        Request: S.Struct({ sectionId: SectionId }),
        execute: ({ sectionId }) => sql`
        SELECT
          id,
          section_id AS "sectionId",
          course_id AS "courseId",
          title,
          description,
          type,
          mdx_content AS "mdxContent",
          video_content AS "videoContent",
          quiz_id AS "quizId",
          quiz_passing_score AS "quizPassingScore",
          quiz_is_required AS "quizIsRequired",
          download_files AS "downloadFiles",
          sort_order AS "sortOrder",
          duration_minutes AS "durationMinutes",
          is_free AS "isFree",
          is_preview AS "isPreview",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM
          course_lessons
        WHERE
          section_id = ${sectionId}
        ORDER BY
          sort_order ASC
      `,
      });

      const findByCourse = SqlSchema.findAll({
        Result: Lesson,
        Request: S.Struct({ courseId: CourseId }),
        execute: ({ courseId }) => sql`
        SELECT
          id,
          section_id AS "sectionId",
          course_id AS "courseId",
          title,
          description,
          type,
          mdx_content AS "mdxContent",
          video_content AS "videoContent",
          quiz_id AS "quizId",
          quiz_passing_score AS "quizPassingScore",
          quiz_is_required AS "quizIsRequired",
          download_files AS "downloadFiles",
          sort_order AS "sortOrder",
          duration_minutes AS "durationMinutes",
          is_free AS "isFree",
          is_preview AS "isPreview",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM
          course_lessons
        WHERE
          course_id = ${courseId}
        ORDER BY
          sort_order ASC
      `,
      });

      const findFreePreviewLessons = SqlSchema.findAll({
        Result: Lesson,
        Request: S.Struct({ courseId: CourseId }),
        execute: ({ courseId }) => sql`
        SELECT
          id,
          section_id AS "sectionId",
          course_id AS "courseId",
          title,
          description,
          type,
          mdx_content AS "mdxContent",
          video_content AS "videoContent",
          quiz_id AS "quizId",
          quiz_passing_score AS "quizPassingScore",
          quiz_is_required AS "quizIsRequired",
          download_files AS "downloadFiles",
          sort_order AS "sortOrder",
          duration_minutes AS "durationMinutes",
          is_free AS "isFree",
          is_preview AS "isPreview",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM
          course_lessons
        WHERE
          course_id = ${courseId}
          AND (is_free = true OR is_preview = true)
        ORDER BY
          sort_order ASC
      `,
      });

      const getNextSortOrder = SqlSchema.single({
        Result: S.Struct({ nextOrder: S.Number }),
        Request: S.Struct({ sectionId: SectionId }),
        execute: ({ sectionId }) => sql`
        SELECT COALESCE(MAX(sort_order), 0) + 1 AS "nextOrder"
        FROM course_lessons
        WHERE section_id = ${sectionId}
      `,
      });

      // ─────────────────────────────────────────────────────────────────────────
      // Mutations
      // ─────────────────────────────────────────────────────────────────────────

      const create = SqlSchema.single({
        Result: Lesson,
        Request: InsertLesson,
        execute: (input) => sql`
        INSERT INTO course_lessons ${sql.insert(input)}
        RETURNING
          id,
          section_id AS "sectionId",
          course_id AS "courseId",
          title,
          description,
          type,
          mdx_content AS "mdxContent",
          video_content AS "videoContent",
          quiz_id AS "quizId",
          quiz_passing_score AS "quizPassingScore",
          quiz_is_required AS "quizIsRequired",
          download_files AS "downloadFiles",
          sort_order AS "sortOrder",
          duration_minutes AS "durationMinutes",
          is_free AS "isFree",
          is_preview AS "isPreview",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      });

      const update = SqlSchema.single({
        Result: Lesson,
        Request: UpdateLessonDb,
        execute: (input) => sql`
        UPDATE course_lessons
        SET
          ${sql.update(input, ['id'])},
          updated_at = NOW()
        WHERE
          id = ${input.id}
        RETURNING
          id,
          section_id AS "sectionId",
          course_id AS "courseId",
          title,
          description,
          type,
          mdx_content AS "mdxContent",
          video_content AS "videoContent",
          quiz_id AS "quizId",
          quiz_passing_score AS "quizPassingScore",
          quiz_is_required AS "quizIsRequired",
          download_files AS "downloadFiles",
          sort_order AS "sortOrder",
          duration_minutes AS "durationMinutes",
          is_free AS "isFree",
          is_preview AS "isPreview",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      });

      const updateSortOrder = SqlSchema.void({
        Request: S.Struct({
          id: LessonId,
          sortOrder: S.Number,
        }),
        execute: ({ id, sortOrder }) => sql`
        UPDATE course_lessons
        SET
          sort_order = ${sortOrder},
          updated_at = NOW()
        WHERE
          id = ${id}
      `,
      });

      const del = SqlSchema.single({
        Result: S.Unknown,
        Request: LessonId,
        execute: (id) => sql`
        DELETE FROM course_lessons
        WHERE id = ${id}
        RETURNING id
      `,
      });

      // ─────────────────────────────────────────────────────────────────────────
      // Public API
      // ─────────────────────────────────────────────────────────────────────────

      return {
        findBySection: (sectionId: SectionId) => findBySection({ sectionId }).pipe(Effect.orDie),

        findByCourse: (courseId: CourseId) => findByCourse({ courseId }).pipe(Effect.orDie),

        findFreePreviewLessons: (courseId: CourseId) =>
          findFreePreviewLessons({ courseId }).pipe(Effect.orDie),

        findById: (id: LessonId) =>
          findById({ id }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new LessonNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        create: (input: CreateLessonInput) =>
          Effect.gen(function* () {
            const sortOrder =
              input.sortOrder ??
              (yield* getNextSortOrder({ sectionId: input.sectionId })).nextOrder;

            return yield* create({
              section_id: input.sectionId,
              course_id: input.courseId,
              title: input.title,
              description: input.description ?? null,
              type: input.type,
              mdx_content: input.mdxContent ?? null,
              video_content: input.videoContent ? JSON.stringify(input.videoContent) : null,
              quiz_id: input.quizId ?? null,
              quiz_passing_score: input.quizPassingScore ?? null,
              quiz_is_required: input.quizIsRequired ?? false,
              download_files: input.downloadFiles ? JSON.stringify(input.downloadFiles) : null,
              sort_order: sortOrder,
              duration_minutes: input.durationMinutes ?? 0,
              is_free: input.isFree ?? false,
              is_preview: input.isPreview ?? false,
            });
          }).pipe(Effect.orDie),

        update: (id: LessonId, input: UpdateLessonInput) =>
          update({
            id,
            ...(input.title !== undefined && { title: input.title }),
            ...(input.description !== undefined && {
              description: input.description,
            }),
            ...(input.type !== undefined && { type: input.type }),
            ...(input.mdxContent !== undefined && {
              mdx_content: input.mdxContent,
            }),
            ...(input.videoContent !== undefined && {
              video_content: input.videoContent ? JSON.stringify(input.videoContent) : null,
            }),
            ...(input.quizId !== undefined && { quiz_id: input.quizId }),
            ...(input.quizPassingScore !== undefined && {
              quiz_passing_score: input.quizPassingScore,
            }),
            ...(input.quizIsRequired !== undefined && {
              quiz_is_required: input.quizIsRequired,
            }),
            ...(input.downloadFiles !== undefined && {
              download_files: input.downloadFiles ? JSON.stringify(input.downloadFiles) : null,
            }),
            ...(input.sortOrder !== undefined && {
              sort_order: input.sortOrder,
            }),
            ...(input.durationMinutes !== undefined && {
              duration_minutes: input.durationMinutes,
            }),
            ...(input.isFree !== undefined && { is_free: input.isFree }),
            ...(input.isPreview !== undefined && {
              is_preview: input.isPreview,
            }),
          }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new LessonNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        reorder: (lessonIds: LessonId[]) =>
          Effect.forEach(lessonIds, (id, index) =>
            updateSortOrder({ id, sortOrder: index }).pipe(Effect.orDie),
          ).pipe(Effect.asVoid),

        delete: (id: LessonId) =>
          del(id).pipe(
            Effect.asVoid,
            Effect.catchTags({
              NoSuchElementException: () => new LessonNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),
      } as const;
    }),
  },
) {}
