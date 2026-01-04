// Section Domain Schema
// Defines course sections for organizing lessons

import * as HttpApiSchema from '@effect/platform/HttpApiSchema';
import * as S from 'effect/Schema';

import { CourseId } from '../../course/domain/schema.js';

// ===========================================
// Branded IDs
// ===========================================

export const SectionId = S.UUID.pipe(S.brand('SectionId'));
export type SectionId = typeof SectionId.Type;

// ===========================================
// Section Entity
// ===========================================

/**
 * Section - organizational unit within a course
 *
 * Sections group related lessons together and are ordered within a course.
 */
export class Section extends S.Class<Section>('Section')({
  id: SectionId,
  courseId: CourseId,

  // Content
  title: S.String,
  description: S.optional(S.NullOr(S.String)),

  // Ordering
  sortOrder: S.Number,

  // Stats (denormalized)
  lessonCount: S.Number,
  totalDurationMinutes: S.Number,

  // Timestamps
  createdAt: S.DateTimeUtc,
  updatedAt: S.DateTimeUtc,
}) {}

// ===========================================
// Input Schemas
// ===========================================

export class CreateSectionInput extends S.Class<CreateSectionInput>('CreateSectionInput')({
  courseId: CourseId,
  title: S.Trim.pipe(
    S.nonEmptyString({ message: () => 'Title is required' }),
    S.maxLength(200, { message: () => 'Title must be at most 200 characters' }),
  ),
  description: S.optional(S.NullOr(S.String.pipe(S.maxLength(1000)))),
  sortOrder: S.optional(S.Number.pipe(S.int())),
}) {}

export class UpdateSectionInput extends S.Class<UpdateSectionInput>('UpdateSectionInput')({
  title: S.optional(
    S.Trim.pipe(
      S.nonEmptyString({ message: () => 'Title is required' }),
      S.maxLength(200, {
        message: () => 'Title must be at most 200 characters',
      }),
    ),
  ),
  description: S.optional(S.NullOr(S.String.pipe(S.maxLength(1000)))),
  sortOrder: S.optional(S.Number.pipe(S.int())),
}) {}

/**
 * Input for reordering sections within a course
 */
export class ReorderSectionsInput extends S.Class<ReorderSectionsInput>('ReorderSectionsInput')({
  courseId: CourseId,
  sectionIds: S.Array(SectionId),
}) {}

// ===========================================
// Errors
// ===========================================

export class SectionNotFoundError extends S.TaggedError<SectionNotFoundError>(
  'SectionNotFoundError',
)('SectionNotFoundError', { id: SectionId }, HttpApiSchema.annotations({ status: 404 })) {
  override get message() {
    return `Section with id ${this.id} not found`;
  }
}
