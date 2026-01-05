import { PgLive } from '@core/database';
import * as SqlClient from '@effect/sql/SqlClient';
import * as SqlSchema from '@effect/sql/SqlSchema';
import * as Effect from 'effect/Effect';
import { flow } from 'effect/Function';
import * as S from 'effect/Schema';

import {
  Category,
  CategoryId,
  CategoryNotFoundError,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../domain/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Internal Input Schemas
// ─────────────────────────────────────────────────────────────────────────────

const InsertCategory = S.Struct({
  name: S.String,
  slug: S.String,
  description: S.NullOr(S.String),
  parent_id: S.NullOr(S.UUID),
  sort_order: S.Number,
  is_active: S.Boolean,
});

const UpdateCategoryDb = S.Struct({
  id: CategoryId,
  name: S.optional(S.String),
  slug: S.optional(S.String),
  description: S.optional(S.NullOr(S.String)),
  parent_id: S.optional(S.NullOr(S.UUID)),
  sort_order: S.optional(S.Number),
  is_active: S.optional(S.Boolean),
});
type UpdateCategoryDb = typeof UpdateCategoryDb.Type;

// ─────────────────────────────────────────────────────────────────────────────
// Repository
// ─────────────────────────────────────────────────────────────────────────────

export class CategoryRepository extends Effect.Service<CategoryRepository>()(
  '@course/CategoryRepository',
  {
    dependencies: [PgLive],
    effect: Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      // ─────────────────────────────────────────────────────────────────────────
      // Queries
      // ─────────────────────────────────────────────────────────────────────────

      const findAll = SqlSchema.findAll({
        Result: Category,
        Request: S.Void,
        execute: () => sql`
          SELECT
            id,
            name,
            slug,
            description,
            parent_id AS "parentId",
            sort_order AS "sortOrder",
            is_active AS "isActive",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM
            course_categories
          ORDER BY
            sort_order ASC, name ASC
        `,
      });

      const findById = SqlSchema.single({
        Result: Category,
        Request: S.Struct({ id: CategoryId }),
        execute: ({ id }) => sql`
          SELECT
            id,
            name,
            slug,
            description,
            parent_id AS "parentId",
            sort_order AS "sortOrder",
            is_active AS "isActive",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM
            course_categories
          WHERE
            id = ${id}
        `,
      });

      const findBySlug = SqlSchema.single({
        Result: Category,
        Request: S.Struct({ slug: S.String }),
        execute: ({ slug }) => sql`
          SELECT
            id,
            name,
            slug,
            description,
            parent_id AS "parentId",
            sort_order AS "sortOrder",
            is_active AS "isActive",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM
            course_categories
          WHERE
            slug = ${slug}
        `,
      });

      const findActive = SqlSchema.findAll({
        Result: Category,
        Request: S.Void,
        execute: () => sql`
          SELECT
            id,
            name,
            slug,
            description,
            parent_id AS "parentId",
            sort_order AS "sortOrder",
            is_active AS "isActive",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM
            course_categories
          WHERE
            is_active = true
          ORDER BY
            sort_order ASC, name ASC
        `,
      });

      const findByParent = SqlSchema.findAll({
        Result: Category,
        Request: S.Struct({ parentId: S.NullOr(CategoryId) }),
        execute: ({ parentId }) => sql`
          SELECT
            id,
            name,
            slug,
            description,
            parent_id AS "parentId",
            sort_order AS "sortOrder",
            is_active AS "isActive",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM
            course_categories
          WHERE
            ${parentId === null ? sql`parent_id IS NULL` : sql`parent_id = ${parentId}`}
          ORDER BY
            sort_order ASC, name ASC
        `,
      });

      // ─────────────────────────────────────────────────────────────────────────
      // Mutations
      // ─────────────────────────────────────────────────────────────────────────

      const create = SqlSchema.single({
        Result: Category,
        Request: InsertCategory,
        execute: (input) => sql`
          INSERT INTO course_categories ${sql.insert(input)}
          RETURNING
            id,
            name,
            slug,
            description,
            parent_id AS "parentId",
            sort_order AS "sortOrder",
            is_active AS "isActive",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
      });

      const update = SqlSchema.single({
        Result: Category,
        Request: UpdateCategoryDb,
        execute: (input) => sql`
          UPDATE course_categories
          SET
            ${sql.update(input, ['id'])},
            updated_at = NOW()
          WHERE
            id = ${input.id}
          RETURNING
            id,
            name,
            slug,
            description,
            parent_id AS "parentId",
            sort_order AS "sortOrder",
            is_active AS "isActive",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
      });

      const del = SqlSchema.single({
        Result: S.Unknown,
        Request: CategoryId,
        execute: (id) => sql`
          DELETE FROM course_categories
          WHERE id = ${id}
          RETURNING id
        `,
      });

      // ─────────────────────────────────────────────────────────────────────────
      // Slug generation helper
      // ─────────────────────────────────────────────────────────────────────────

      const generateSlug = (name: string): string => {
        return name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      };

      // ─────────────────────────────────────────────────────────────────────────
      // Public API
      // ─────────────────────────────────────────────────────────────────────────

      return {
        findAll: flow(findAll, Effect.orDie),

        findActive: flow(findActive, Effect.orDie),

        findByParent: (parentId: CategoryId | null) =>
          findByParent({ parentId }).pipe(Effect.orDie),

        findById: (id: CategoryId) =>
          findById({ id }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new CategoryNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        findBySlug: (slug: string) =>
          findBySlug({ slug }).pipe(
            Effect.catchTags({
              NoSuchElementException: () =>
                Effect.fail(new CategoryNotFoundError({ id: slug as CategoryId })),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        create: (input: CreateCategoryInput) =>
          create({
            name: input.name,
            slug: input.slug ?? generateSlug(input.name),
            description: input.description ?? null,
            parent_id: input.parentId ?? null,
            sort_order: input.sortOrder ?? 0,
            is_active: true,
          }).pipe(Effect.orDie),

        update: (id: CategoryId, input: UpdateCategoryInput) =>
          update({
            id,
            ...(input.name !== undefined && { name: input.name }),
            ...(input.slug !== undefined && { slug: input.slug }),
            ...(input.description !== undefined && {
              description: input.description,
            }),
            ...(input.parentId !== undefined && { parent_id: input.parentId }),
            ...(input.sortOrder !== undefined && {
              sort_order: input.sortOrder,
            }),
            ...(input.isActive !== undefined && { is_active: input.isActive }),
          }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new CategoryNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        delete: (id: CategoryId) =>
          del(id).pipe(
            Effect.asVoid,
            Effect.catchTags({
              NoSuchElementException: () => new CategoryNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),
      } as const;
    }),
  },
) {}
