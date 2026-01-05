// Path Domain Schema
// Defines parallel learning paths within a course (e.g., Songwriting, Artistry, Business)

import * as HttpApiSchema from '@effect/platform/HttpApiSchema';
import * as S from 'effect/Schema';

import { CourseId } from '../../course/domain/schema.js';

// ===========================================
// Branded IDs
// ===========================================

export const PathId = S.UUID.pipe(S.brand('PathId'));
export type PathId = typeof PathId.Type;

// ===========================================
// Path Entity
// ===========================================

/**
 * Path - a thematic learning path within a course
 *
 * Paths allow courses to have parallel subjects that progress together.
 * For example, a music course might have:
 * - Songwriting path (theory, composition, lyrics)
 * - Artistry path (creativity, mindset, expression)
 * - Business path (monetization, marketing, industry)
 *
 * Lessons are tagged with a path, and users can see their
 * progress per path on the course overview.
 */
export class Path extends S.Class<Path>('Path')({
  id: PathId,
  courseId: CourseId,

  // Display
  name: S.String,
  slug: S.String,
  description: S.optional(S.NullOr(S.String)),

  // Visual styling
  color: S.String, // Hex color for UI (e.g., "#3B82F6")
  icon: S.optional(S.NullOr(S.String)), // Lucide icon name (e.g., "music", "palette", "dollar-sign")

  // Ordering
  sortOrder: S.Number,

  // Timestamps
  createdAt: S.DateTimeUtc,
  updatedAt: S.DateTimeUtc,
}) {}

// ===========================================
// Input Schemas
// ===========================================

export class CreatePathInput extends S.Class<CreatePathInput>('CreatePathInput')({
  courseId: CourseId,
  name: S.Trim.pipe(
    S.nonEmptyString({ message: () => 'Name is required' }),
    S.maxLength(100, { message: () => 'Name must be at most 100 characters' }),
  ),
  slug: S.Trim.pipe(
    S.nonEmptyString({ message: () => 'Slug is required' }),
    S.pattern(/^[a-z0-9-]+$/, {
      message: () => 'Slug must be lowercase alphanumeric with dashes',
    }),
    S.maxLength(100),
  ),
  description: S.optional(S.NullOr(S.String.pipe(S.maxLength(500)))),
  color: S.String.pipe(
    S.pattern(/^#[0-9A-Fa-f]{6}$/, {
      message: () => 'Color must be a valid hex color',
    }),
  ),
  icon: S.optional(S.NullOr(S.String.pipe(S.maxLength(50)))),
  sortOrder: S.optional(S.Number.pipe(S.int())),
}) {}

export class UpdatePathInput extends S.Class<UpdatePathInput>('UpdatePathInput')({
  name: S.optional(
    S.Trim.pipe(
      S.nonEmptyString({ message: () => 'Name is required' }),
      S.maxLength(100, { message: () => 'Name must be at most 100 characters' }),
    ),
  ),
  slug: S.optional(
    S.Trim.pipe(
      S.nonEmptyString({ message: () => 'Slug is required' }),
      S.pattern(/^[a-z0-9-]+$/, {
        message: () => 'Slug must be lowercase alphanumeric with dashes',
      }),
      S.maxLength(100),
    ),
  ),
  description: S.optional(S.NullOr(S.String.pipe(S.maxLength(500)))),
  color: S.optional(
    S.String.pipe(
      S.pattern(/^#[0-9A-Fa-f]{6}$/, {
        message: () => 'Color must be a valid hex color',
      }),
    ),
  ),
  icon: S.optional(S.NullOr(S.String.pipe(S.maxLength(50)))),
  sortOrder: S.optional(S.Number.pipe(S.int())),
}) {}

// ===========================================
// Errors
// ===========================================

export class PathNotFoundError extends S.TaggedError<PathNotFoundError>('PathNotFoundError')(
  'PathNotFoundError',
  { id: PathId },
  HttpApiSchema.annotations({ status: 404 }),
) {
  override get message() {
    return `Path with id ${this.id} not found`;
  }
}
