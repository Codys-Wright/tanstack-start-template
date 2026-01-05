// LessonPart Domain Schema
// Defines parts within a lesson for mixed content types

import * as HttpApiSchema from '@effect/platform/HttpApiSchema';
import * as S from 'effect/Schema';

import { LessonId, LessonType, VideoContent, DownloadFile } from '../../lesson/domain/schema.js';

// ===========================================
// Branded IDs
// ===========================================

export const LessonPartId = S.UUID.pipe(S.brand('LessonPartId'));
export type LessonPartId = typeof LessonPartId.Type;

// ===========================================
// LessonPart Entity
// ===========================================

/**
 * LessonPart - individual content block within a lesson
 *
 * A lesson can have multiple parts of different types, allowing for
 * mixed content like: text -> quiz -> text -> video -> assignment
 *
 * This enables interactive lessons without requiring MDX component embedding.
 */
export class LessonPart extends S.Class<LessonPart>('LessonPart')({
  id: LessonPartId,
  lessonId: LessonId,

  // Content
  title: S.String,

  // Part type (same types as Lesson)
  type: LessonType,

  // Ordering within the lesson
  sortOrder: S.Number,

  // Duration in minutes for this part
  durationMinutes: S.Number,

  // MDX content for text/assignment parts
  mdxContent: S.optional(S.NullOr(S.String)),

  // Video content for video parts
  videoContent: S.optional(S.NullOr(S.parseJson(VideoContent))),

  // Quiz reference for quiz parts
  quizId: S.optional(S.NullOr(S.UUID)),
  quizPassingScore: S.optional(S.NullOr(S.Number)),
  quizIsRequired: S.optional(S.Boolean),

  // Download files for download parts
  downloadFiles: S.optional(S.NullOr(S.parseJson(S.Array(DownloadFile)))),

  // Timestamps
  createdAt: S.DateTimeUtc,
  updatedAt: S.DateTimeUtc,
}) {}

// ===========================================
// Input Schemas
// ===========================================

export class CreateLessonPartInput extends S.Class<CreateLessonPartInput>('CreateLessonPartInput')({
  lessonId: LessonId,
  title: S.Trim.pipe(
    S.nonEmptyString({ message: () => 'Title is required' }),
    S.maxLength(200, { message: () => 'Title must be at most 200 characters' }),
  ),
  type: LessonType,
  sortOrder: S.optional(S.Number.pipe(S.int())),
  durationMinutes: S.optional(S.Number.pipe(S.int(), S.nonNegative())),
  mdxContent: S.optional(S.NullOr(S.String)),
  videoContent: S.optional(S.NullOr(VideoContent)),
  quizId: S.optional(S.NullOr(S.UUID)),
  quizPassingScore: S.optional(S.NullOr(S.Number.pipe(S.between(0, 100)))),
  quizIsRequired: S.optional(S.Boolean),
  downloadFiles: S.optional(S.Array(DownloadFile)),
}) {}

export class UpdateLessonPartInput extends S.Class<UpdateLessonPartInput>('UpdateLessonPartInput')({
  title: S.optional(
    S.Trim.pipe(
      S.nonEmptyString({ message: () => 'Title is required' }),
      S.maxLength(200, {
        message: () => 'Title must be at most 200 characters',
      }),
    ),
  ),
  type: S.optional(LessonType),
  sortOrder: S.optional(S.Number.pipe(S.int())),
  durationMinutes: S.optional(S.Number.pipe(S.int(), S.nonNegative())),
  mdxContent: S.optional(S.NullOr(S.String)),
  videoContent: S.optional(S.NullOr(VideoContent)),
  quizId: S.optional(S.NullOr(S.UUID)),
  quizPassingScore: S.optional(S.NullOr(S.Number.pipe(S.between(0, 100)))),
  quizIsRequired: S.optional(S.Boolean),
  downloadFiles: S.optional(S.Array(DownloadFile)),
}) {}

/**
 * Input for reordering parts within a lesson
 */
export class ReorderLessonPartsInput extends S.Class<ReorderLessonPartsInput>(
  'ReorderLessonPartsInput',
)({
  lessonId: LessonId,
  partIds: S.Array(LessonPartId),
}) {}

// ===========================================
// Errors
// ===========================================

export class LessonPartNotFoundError extends S.TaggedError<LessonPartNotFoundError>(
  'LessonPartNotFoundError',
)('LessonPartNotFoundError', { id: LessonPartId }, HttpApiSchema.annotations({ status: 404 })) {
  override get message() {
    return `Lesson part with id ${this.id} not found`;
  }
}
