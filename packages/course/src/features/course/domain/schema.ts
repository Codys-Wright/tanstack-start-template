// Course Domain Schema
// Defines the core course entity and related types

import * as HttpApiSchema from '@effect/platform/HttpApiSchema';
import * as S from 'effect/Schema';

import { CategoryId } from '../../category/domain/schema.js';
import { InstructorId } from '../../instructor/domain/schema.js';

// ===========================================
// Branded IDs
// ===========================================

export const CourseId = S.UUID.pipe(S.brand('CourseId'));
export type CourseId = typeof CourseId.Type;

// ===========================================
// Enums / Literals
// ===========================================

export const CourseStatus = S.Literal('draft', 'published', 'archived');
export type CourseStatus = typeof CourseStatus.Type;

export const CourseLevel = S.Literal('beginner', 'intermediate', 'advanced', 'all-levels');
export type CourseLevel = typeof CourseLevel.Type;

export const PricingModel = S.Literal('free', 'one-time', 'subscription', 'freemium');
export type PricingModel = typeof PricingModel.Type;

// ===========================================
// Value Objects
// ===========================================

/**
 * Course pricing configuration
 * Supports multiple pricing models for flexibility
 */
export class CoursePricing extends S.Class<CoursePricing>('CoursePricing')({
  model: PricingModel,
  price: S.optional(S.Number.pipe(S.positive())),
  currency: S.optional(S.String),
  // For freemium: number of free lessons before paywall
  freeLessonCount: S.optional(S.Number.pipe(S.int(), S.nonNegative())),
  // TODO: Add subscription tier reference when payment package is implemented
  // subscriptionTierId: S.optional(SubscriptionTierId),
}) {}

// ===========================================
// Course Entity
// ===========================================

/**
 * Course - main course entity
 *
 * A course belongs to an instructor and contains sections with lessons.
 * Supports multiple pricing models and categorization.
 */
export class Course extends S.Class<Course>('Course')({
  id: CourseId,
  instructorId: InstructorId,

  // Content
  title: S.String,
  slug: S.String,
  subtitle: S.optional(S.NullOr(S.String)),
  description: S.optional(S.NullOr(S.String)),
  thumbnailUrl: S.optional(S.NullOr(S.String)),
  previewVideoUrl: S.optional(S.NullOr(S.String)),

  // Categorization
  categoryId: S.optional(S.NullOr(CategoryId)),
  tags: S.optional(S.NullOr(S.parseJson(S.Array(S.String)))),
  level: CourseLevel,
  language: S.String,

  // Pricing
  pricing: S.parseJson(CoursePricing),

  // Requirements and outcomes
  requirements: S.optional(S.NullOr(S.parseJson(S.Array(S.String)))),
  learningOutcomes: S.optional(S.NullOr(S.parseJson(S.Array(S.String)))),

  // Stats (denormalized for performance)
  totalDurationMinutes: S.Number,
  lessonCount: S.Number,
  sectionCount: S.Number,
  enrollmentCount: S.Number,
  averageRating: S.optional(S.NullOr(S.Number)),
  reviewCount: S.Number,

  // Status
  status: CourseStatus,
  publishedAt: S.optional(S.NullOr(S.DateTimeUtc)),

  // Timestamps
  createdAt: S.DateTimeUtc,
  updatedAt: S.DateTimeUtc,
  deletedAt: S.optional(S.NullOr(S.DateTimeUtc)),
}) {}

// ===========================================
// Input Schemas
// ===========================================

/**
 * Input for creating a new course
 */
export class CreateCourseInput extends S.Class<CreateCourseInput>('CreateCourseInput')({
  instructorId: InstructorId,
  title: S.Trim.pipe(
    S.nonEmptyString({ message: () => 'Title is required' }),
    S.maxLength(200, { message: () => 'Title must be at most 200 characters' }),
  ),
  slug: S.optional(
    S.Trim.pipe(
      S.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: () => 'Slug must be lowercase alphanumeric with hyphens',
      }),
    ),
  ),
  subtitle: S.optional(S.NullOr(S.String.pipe(S.maxLength(300)))),
  description: S.optional(S.NullOr(S.String.pipe(S.maxLength(5000)))),
  thumbnailUrl: S.optional(S.NullOr(S.String)),
  previewVideoUrl: S.optional(S.NullOr(S.String)),
  categoryId: S.optional(S.NullOr(CategoryId)),
  tags: S.optional(S.Array(S.String)),
  level: S.optional(CourseLevel),
  language: S.optional(S.String),
  pricing: S.optional(CoursePricing),
  requirements: S.optional(S.Array(S.String)),
  learningOutcomes: S.optional(S.Array(S.String)),
}) {}

/**
 * Input for updating a course
 */
export class UpdateCourseInput extends S.Class<UpdateCourseInput>('UpdateCourseInput')({
  title: S.optional(
    S.Trim.pipe(
      S.nonEmptyString({ message: () => 'Title is required' }),
      S.maxLength(200, {
        message: () => 'Title must be at most 200 characters',
      }),
    ),
  ),
  slug: S.optional(
    S.Trim.pipe(
      S.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: () => 'Slug must be lowercase alphanumeric with hyphens',
      }),
    ),
  ),
  subtitle: S.optional(S.NullOr(S.String.pipe(S.maxLength(300)))),
  description: S.optional(S.NullOr(S.String.pipe(S.maxLength(5000)))),
  thumbnailUrl: S.optional(S.NullOr(S.String)),
  previewVideoUrl: S.optional(S.NullOr(S.String)),
  categoryId: S.optional(S.NullOr(CategoryId)),
  tags: S.optional(S.Array(S.String)),
  level: S.optional(CourseLevel),
  language: S.optional(S.String),
  pricing: S.optional(CoursePricing),
  requirements: S.optional(S.Array(S.String)),
  learningOutcomes: S.optional(S.Array(S.String)),
  status: S.optional(CourseStatus),
}) {}

// ===========================================
// Errors
// ===========================================

export class CourseNotFoundError extends S.TaggedError<CourseNotFoundError>('CourseNotFoundError')(
  'CourseNotFoundError',
  { id: CourseId },
  HttpApiSchema.annotations({ status: 404 }),
) {
  override get message() {
    return `Course with id ${this.id} not found`;
  }
}

export class CourseSlugExistsError extends S.TaggedError<CourseSlugExistsError>(
  'CourseSlugExistsError',
)('CourseSlugExistsError', { slug: S.String }, HttpApiSchema.annotations({ status: 409 })) {
  override get message() {
    return `Course with slug "${this.slug}" already exists`;
  }
}

export class CourseValidationError extends S.TaggedError<CourseValidationError>(
  'CourseValidationError',
)(
  'CourseValidationError',
  {
    field: S.String,
    message: S.String,
  },
  HttpApiSchema.annotations({ status: 400 }),
) {}
