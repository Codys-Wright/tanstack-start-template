// Instructor Domain Schema
// Defines instructor profiles that extend user accounts

import { UserId } from '@auth';
import * as HttpApiSchema from '@effect/platform/HttpApiSchema';
import * as S from 'effect/Schema';

// ===========================================
// Branded IDs
// ===========================================

export const InstructorId = S.UUID.pipe(S.brand('InstructorId'));
export type InstructorId = typeof InstructorId.Type;

// ===========================================
// Enums / Literals
// ===========================================

export const InstructorStatus = S.Literal('pending', 'approved', 'suspended');
export type InstructorStatus = typeof InstructorStatus.Type;

// ===========================================
// Instructor Entity
// ===========================================

/**
 * InstructorProfile - extends a user to become an instructor
 *
 * Users can apply to become instructors. Once approved, they can create courses.
 * Stats are denormalized for performance.
 */
export class InstructorProfile extends S.Class<InstructorProfile>('InstructorProfile')({
  id: InstructorId,
  userId: UserId,

  // Profile info
  displayName: S.String,
  bio: S.optional(S.NullOr(S.String)),
  headline: S.optional(S.NullOr(S.String)),
  avatarUrl: S.optional(S.NullOr(S.String)),

  // Social links
  websiteUrl: S.optional(S.NullOr(S.String)),
  linkedinUrl: S.optional(S.NullOr(S.String)),
  twitterUrl: S.optional(S.NullOr(S.String)),
  youtubeUrl: S.optional(S.NullOr(S.String)),

  // Stats (denormalized for performance)
  totalStudents: S.Number,
  totalCourses: S.Number,
  averageRating: S.optional(S.NullOr(S.Number)),
  totalReviews: S.Number,

  // Status
  status: InstructorStatus,
  approvedAt: S.optional(S.NullOr(S.DateTimeUtc)),

  // Timestamps
  createdAt: S.DateTimeUtc,
  updatedAt: S.DateTimeUtc,
}) {}

// ===========================================
// Input Schemas
// ===========================================

/**
 * Input for applying to become an instructor
 */
export class CreateInstructorInput extends S.Class<CreateInstructorInput>('CreateInstructorInput')({
  userId: UserId,
  displayName: S.Trim.pipe(
    S.nonEmptyString({ message: () => 'Display name is required' }),
    S.maxLength(100, {
      message: () => 'Display name must be at most 100 characters',
    }),
  ),
  bio: S.optional(S.NullOr(S.String.pipe(S.maxLength(2000)))),
  headline: S.optional(S.NullOr(S.String.pipe(S.maxLength(200)))),
  avatarUrl: S.optional(S.NullOr(S.String)),
  websiteUrl: S.optional(S.NullOr(S.String)),
  linkedinUrl: S.optional(S.NullOr(S.String)),
  twitterUrl: S.optional(S.NullOr(S.String)),
  youtubeUrl: S.optional(S.NullOr(S.String)),
}) {}

/**
 * Input for updating an instructor profile
 */
export class UpdateInstructorInput extends S.Class<UpdateInstructorInput>('UpdateInstructorInput')({
  displayName: S.optional(
    S.Trim.pipe(
      S.nonEmptyString({ message: () => 'Display name is required' }),
      S.maxLength(100, {
        message: () => 'Display name must be at most 100 characters',
      }),
    ),
  ),
  bio: S.optional(S.NullOr(S.String.pipe(S.maxLength(2000)))),
  headline: S.optional(S.NullOr(S.String.pipe(S.maxLength(200)))),
  avatarUrl: S.optional(S.NullOr(S.String)),
  websiteUrl: S.optional(S.NullOr(S.String)),
  linkedinUrl: S.optional(S.NullOr(S.String)),
  twitterUrl: S.optional(S.NullOr(S.String)),
  youtubeUrl: S.optional(S.NullOr(S.String)),
}) {}

// ===========================================
// Errors
// ===========================================

export class InstructorNotFoundError extends S.TaggedError<InstructorNotFoundError>(
  'InstructorNotFoundError',
)('InstructorNotFoundError', { id: InstructorId }, HttpApiSchema.annotations({ status: 404 })) {
  override get message() {
    return `Instructor with id ${this.id} not found`;
  }
}

export class InstructorAlreadyExistsError extends S.TaggedError<InstructorAlreadyExistsError>(
  'InstructorAlreadyExistsError',
)('InstructorAlreadyExistsError', { userId: UserId }, HttpApiSchema.annotations({ status: 409 })) {
  override get message() {
    return `User ${this.userId} is already an instructor`;
  }
}

export class InstructorNotApprovedError extends S.TaggedError<InstructorNotApprovedError>(
  'InstructorNotApprovedError',
)('InstructorNotApprovedError', { id: InstructorId }, HttpApiSchema.annotations({ status: 403 })) {
  override get message() {
    return `Instructor ${this.id} is not approved`;
  }
}
