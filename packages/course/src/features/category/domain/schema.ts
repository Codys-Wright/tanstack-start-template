// Category Domain Schema
// Defines course categories for organization

import * as HttpApiSchema from '@effect/platform/HttpApiSchema';
import * as S from 'effect/Schema';

// ===========================================
// Branded IDs
// ===========================================

export const CategoryId = S.UUID.pipe(S.brand('CategoryId'));
export type CategoryId = typeof CategoryId.Type;

// ===========================================
// Category Entity
// ===========================================

/**
 * Category - hierarchical course categories
 *
 * Categories can have a parent for nested organization (e.g., "Music > Production > Mixing")
 */
export class Category extends S.Class<Category>('Category')({
  id: CategoryId,
  name: S.String,
  slug: S.String,
  description: S.optional(S.NullOr(S.String)),
  parentId: S.optional(S.NullOr(CategoryId)),
  sortOrder: S.Number,
  isActive: S.Boolean,
  createdAt: S.DateTimeUtc,
  updatedAt: S.DateTimeUtc,
}) {}

// ===========================================
// Input Schemas
// ===========================================

export class CreateCategoryInput extends S.Class<CreateCategoryInput>('CreateCategoryInput')({
  name: S.Trim.pipe(
    S.nonEmptyString({ message: () => 'Name is required' }),
    S.maxLength(100, { message: () => 'Name must be at most 100 characters' }),
  ),
  slug: S.optional(
    S.Trim.pipe(
      S.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: () => 'Slug must be lowercase alphanumeric with hyphens',
      }),
    ),
  ),
  description: S.optional(S.NullOr(S.String.pipe(S.maxLength(500)))),
  parentId: S.optional(S.NullOr(CategoryId)),
  sortOrder: S.optional(S.Number.pipe(S.int())),
}) {}

export class UpdateCategoryInput extends S.Class<UpdateCategoryInput>('UpdateCategoryInput')({
  name: S.optional(
    S.Trim.pipe(
      S.nonEmptyString({ message: () => 'Name is required' }),
      S.maxLength(100, { message: () => 'Name must be at most 100 characters' }),
    ),
  ),
  slug: S.optional(
    S.Trim.pipe(
      S.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: () => 'Slug must be lowercase alphanumeric with hyphens',
      }),
    ),
  ),
  description: S.optional(S.NullOr(S.String.pipe(S.maxLength(500)))),
  parentId: S.optional(S.NullOr(CategoryId)),
  sortOrder: S.optional(S.Number.pipe(S.int())),
  isActive: S.optional(S.Boolean),
}) {}

// ===========================================
// Errors
// ===========================================

export class CategoryNotFoundError extends S.TaggedError<CategoryNotFoundError>(
  'CategoryNotFoundError',
)('CategoryNotFoundError', { id: CategoryId }, HttpApiSchema.annotations({ status: 404 })) {
  override get message() {
    return `Category with id ${this.id} not found`;
  }
}

export class CategorySlugExistsError extends S.TaggedError<CategorySlugExistsError>(
  'CategorySlugExistsError',
)('CategorySlugExistsError', { slug: S.String }, HttpApiSchema.annotations({ status: 409 })) {
  override get message() {
    return `Category with slug "${this.slug}" already exists`;
  }
}
