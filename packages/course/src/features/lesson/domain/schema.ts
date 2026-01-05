// Lesson Domain Schema
// Defines lessons with MDX content support for rich course content

import * as HttpApiSchema from '@effect/platform/HttpApiSchema';
import * as S from 'effect/Schema';

import { CourseId } from '../../course/domain/schema.js';
import { SectionId } from '../../section/domain/schema.js';

// ===========================================
// Branded IDs
// ===========================================

export const LessonId = S.UUID.pipe(S.brand('LessonId'));
export type LessonId = typeof LessonId.Type;

// ===========================================
// Enums / Literals
// ===========================================

export const LessonType = S.Literal('video', 'text', 'quiz', 'assignment', 'download');
export type LessonType = typeof LessonType.Type;

export const VideoProvider = S.Literal('youtube', 'vimeo', 'custom');
export type VideoProvider = typeof VideoProvider.Type;

// ===========================================
// Value Objects - Content Types
// ===========================================

/**
 * Video content configuration
 * Supports YouTube, Vimeo, or custom video sources
 */
export class VideoContent extends S.Class<VideoContent>('VideoContent')({
  provider: VideoProvider,
  videoId: S.String,
  durationSeconds: S.Number,
  thumbnailUrl: S.optional(S.NullOr(S.String)),
}) {}

/**
 * Download file metadata
 */
export class DownloadFile extends S.Class<DownloadFile>('DownloadFile')({
  name: S.String,
  url: S.String,
  sizeBytes: S.Number,
  mimeType: S.String,
}) {}

// ===========================================
// Lesson Entity
// ===========================================

/**
 * Lesson - individual learning unit within a section
 *
 * Lessons can contain various content types:
 * - video: Embedded video from YouTube/Vimeo
 * - text: MDX content rendered with Tailwind Typography
 * - quiz: Reference to a quiz from @quiz package
 * - assignment: Text-based assignment with MDX
 * - download: Downloadable resources
 *
 * MDX content supports injected components like:
 * - <Quiz /> - Inline quiz component
 * - <CodePlayground /> - Interactive code editor
 * - <VideoEmbed /> - Video within text content
 */
export class Lesson extends S.Class<Lesson>('Lesson')({
  id: LessonId,
  sectionId: SectionId,
  courseId: CourseId,

  // Content
  title: S.String,
  description: S.optional(S.NullOr(S.String)),

  // Lesson type
  type: LessonType,

  // MDX content for text/assignment lessons
  // Rendered with Tailwind Typography, supports custom components
  mdxContent: S.optional(S.NullOr(S.String)),

  // Video content for video lessons
  videoContent: S.optional(S.NullOr(S.parseJson(VideoContent))),

  // Quiz reference for quiz lessons (references @quiz package)
  quizId: S.optional(S.NullOr(S.UUID)),
  quizPassingScore: S.optional(S.NullOr(S.Number)),
  quizIsRequired: S.optional(S.Boolean),

  // Download files for download lessons
  downloadFiles: S.optional(S.NullOr(S.parseJson(S.Array(DownloadFile)))),

  // Ordering
  sortOrder: S.Number,

  // Duration in minutes
  durationMinutes: S.Number,

  // Access control
  isFree: S.Boolean,
  isPreview: S.Boolean,

  // Timestamps
  createdAt: S.DateTimeUtc,
  updatedAt: S.DateTimeUtc,
}) {}

// ===========================================
// Input Schemas
// ===========================================

export class CreateLessonInput extends S.Class<CreateLessonInput>('CreateLessonInput')({
  sectionId: SectionId,
  courseId: CourseId,
  title: S.Trim.pipe(
    S.nonEmptyString({ message: () => 'Title is required' }),
    S.maxLength(200, { message: () => 'Title must be at most 200 characters' }),
  ),
  description: S.optional(S.NullOr(S.String.pipe(S.maxLength(1000)))),
  type: LessonType,
  mdxContent: S.optional(S.NullOr(S.String)),
  videoContent: S.optional(S.NullOr(VideoContent)),
  quizId: S.optional(S.NullOr(S.UUID)),
  quizPassingScore: S.optional(S.NullOr(S.Number.pipe(S.between(0, 100)))),
  quizIsRequired: S.optional(S.Boolean),
  downloadFiles: S.optional(S.Array(DownloadFile)),
  sortOrder: S.optional(S.Number.pipe(S.int())),
  durationMinutes: S.optional(S.Number.pipe(S.int(), S.nonNegative())),
  isFree: S.optional(S.Boolean),
  isPreview: S.optional(S.Boolean),
}) {}

export class UpdateLessonInput extends S.Class<UpdateLessonInput>('UpdateLessonInput')({
  title: S.optional(
    S.Trim.pipe(
      S.nonEmptyString({ message: () => 'Title is required' }),
      S.maxLength(200, {
        message: () => 'Title must be at most 200 characters',
      }),
    ),
  ),
  description: S.optional(S.NullOr(S.String.pipe(S.maxLength(1000)))),
  type: S.optional(LessonType),
  mdxContent: S.optional(S.NullOr(S.String)),
  videoContent: S.optional(S.NullOr(VideoContent)),
  quizId: S.optional(S.NullOr(S.UUID)),
  quizPassingScore: S.optional(S.NullOr(S.Number.pipe(S.between(0, 100)))),
  quizIsRequired: S.optional(S.Boolean),
  downloadFiles: S.optional(S.Array(DownloadFile)),
  sortOrder: S.optional(S.Number.pipe(S.int())),
  durationMinutes: S.optional(S.Number.pipe(S.int(), S.nonNegative())),
  isFree: S.optional(S.Boolean),
  isPreview: S.optional(S.Boolean),
}) {}

/**
 * Input for reordering lessons within a section
 */
export class ReorderLessonsInput extends S.Class<ReorderLessonsInput>('ReorderLessonsInput')({
  sectionId: SectionId,
  lessonIds: S.Array(LessonId),
}) {}

// ===========================================
// Errors
// ===========================================

export class LessonNotFoundError extends S.TaggedError<LessonNotFoundError>('LessonNotFoundError')(
  'LessonNotFoundError',
  { id: LessonId },
  HttpApiSchema.annotations({ status: 404 }),
) {
  override get message() {
    return `Lesson with id ${this.id} not found`;
  }
}

export class LessonAccessDeniedError extends S.TaggedError<LessonAccessDeniedError>(
  'LessonAccessDeniedError',
)('LessonAccessDeniedError', { id: LessonId }, HttpApiSchema.annotations({ status: 403 })) {
  override get message() {
    return `Access denied to lesson ${this.id}. Enrollment required.`;
  }
}
