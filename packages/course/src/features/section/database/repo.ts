import { PgLive } from '@core/database';
import * as SqlClient from '@effect/sql/SqlClient';
import * as SqlSchema from '@effect/sql/SqlSchema';
import * as Effect from 'effect/Effect';
import * as S from 'effect/Schema';

import { CourseId } from '../../course/domain/schema.js';
import {
  CreateSectionInput,
  Section,
  SectionId,
  SectionNotFoundError,
  UpdateSectionInput,
} from '../domain/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Internal Input Schemas
// ─────────────────────────────────────────────────────────────────────────────

const InsertSection = S.Struct({
  course_id: S.UUID,
  title: S.String,
  description: S.NullOr(S.String),
  sort_order: S.Number,
});

const UpdateSectionDb = S.Struct({
  id: SectionId,
  title: S.optional(S.String),
  description: S.optional(S.NullOr(S.String)),
  sort_order: S.optional(S.Number),
});
type UpdateSectionDb = typeof UpdateSectionDb.Type;

// ─────────────────────────────────────────────────────────────────────────────
// Repository
// ─────────────────────────────────────────────────────────────────────────────

export class SectionRepository extends Effect.Service<SectionRepository>()(
  '@course/SectionRepository',
  {
    dependencies: [PgLive],
    effect: Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      // ─────────────────────────────────────────────────────────────────────────
      // Queries
      // ─────────────────────────────────────────────────────────────────────────

      const findById = SqlSchema.single({
        Result: Section,
        Request: S.Struct({ id: SectionId }),
        execute: ({ id }) => sql`
          SELECT
            id,
            course_id AS "courseId",
            title,
            description,
            sort_order AS "sortOrder",
            lesson_count AS "lessonCount",
            total_duration_minutes AS "totalDurationMinutes",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM
            course_sections
          WHERE
            id = ${id}
        `,
      });

      const findByCourse = SqlSchema.findAll({
        Result: Section,
        Request: S.Struct({ courseId: CourseId }),
        execute: ({ courseId }) => sql`
          SELECT
            id,
            course_id AS "courseId",
            title,
            description,
            sort_order AS "sortOrder",
            lesson_count AS "lessonCount",
            total_duration_minutes AS "totalDurationMinutes",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM
            course_sections
          WHERE
            course_id = ${courseId}
          ORDER BY
            sort_order ASC
        `,
      });

      const getNextSortOrder = SqlSchema.single({
        Result: S.Struct({ nextOrder: S.Number }),
        Request: S.Struct({ courseId: CourseId }),
        execute: ({ courseId }) => sql`
          SELECT COALESCE(MAX(sort_order), 0) + 1 AS "nextOrder"
          FROM course_sections
          WHERE course_id = ${courseId}
        `,
      });

      // ─────────────────────────────────────────────────────────────────────────
      // Mutations
      // ─────────────────────────────────────────────────────────────────────────

      const create = SqlSchema.single({
        Result: Section,
        Request: InsertSection,
        execute: (input) => sql`
          INSERT INTO course_sections ${sql.insert(input)}
          RETURNING
            id,
            course_id AS "courseId",
            title,
            description,
            sort_order AS "sortOrder",
            lesson_count AS "lessonCount",
            total_duration_minutes AS "totalDurationMinutes",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
      });

      const update = SqlSchema.single({
        Result: Section,
        Request: UpdateSectionDb,
        execute: (input) => sql`
          UPDATE course_sections
          SET
            ${sql.update(input, ['id'])},
            updated_at = NOW()
          WHERE
            id = ${input.id}
          RETURNING
            id,
            course_id AS "courseId",
            title,
            description,
            sort_order AS "sortOrder",
            lesson_count AS "lessonCount",
            total_duration_minutes AS "totalDurationMinutes",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
      });

      const updateSortOrder = SqlSchema.void({
        Request: S.Struct({
          id: SectionId,
          sortOrder: S.Number,
        }),
        execute: ({ id, sortOrder }) => sql`
          UPDATE course_sections
          SET
            sort_order = ${sortOrder},
            updated_at = NOW()
          WHERE
            id = ${id}
        `,
      });

      const del = SqlSchema.single({
        Result: S.Unknown,
        Request: SectionId,
        execute: (id) => sql`
          DELETE FROM course_sections
          WHERE id = ${id}
          RETURNING id
        `,
      });

      // ─────────────────────────────────────────────────────────────────────────
      // Public API
      // ─────────────────────────────────────────────────────────────────────────

      return {
        findByCourse: (courseId: CourseId) => findByCourse({ courseId }).pipe(Effect.orDie),

        findById: (id: SectionId) =>
          findById({ id }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new SectionNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        create: (input: CreateSectionInput) =>
          Effect.gen(function* () {
            const sortOrder =
              input.sortOrder ?? (yield* getNextSortOrder({ courseId: input.courseId })).nextOrder;

            return yield* create({
              course_id: input.courseId,
              title: input.title,
              description: input.description ?? null,
              sort_order: sortOrder,
            });
          }).pipe(Effect.orDie),

        update: (id: SectionId, input: UpdateSectionInput) =>
          update({
            id,
            ...(input.title !== undefined && { title: input.title }),
            ...(input.description !== undefined && {
              description: input.description,
            }),
            ...(input.sortOrder !== undefined && {
              sort_order: input.sortOrder,
            }),
          }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new SectionNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        reorder: (sectionIds: SectionId[]) =>
          Effect.forEach(sectionIds, (id, index) =>
            updateSortOrder({ id, sortOrder: index }).pipe(Effect.orDie),
          ).pipe(Effect.asVoid),

        delete: (id: SectionId) =>
          del(id).pipe(
            Effect.asVoid,
            Effect.catchTags({
              NoSuchElementException: () => new SectionNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),
      } as const;
    }),
  },
) {}
