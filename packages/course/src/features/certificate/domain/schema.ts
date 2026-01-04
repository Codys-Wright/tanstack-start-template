// Certificate Domain Schema
// Defines completion certificates for courses

import { UserId } from '@auth';
import * as HttpApiSchema from '@effect/platform/HttpApiSchema';
import * as S from 'effect/Schema';

import { CourseId } from '../../course/domain/schema.js';
import { EnrollmentId } from '../../enrollment/domain/schema.js';

// ===========================================
// Branded IDs
// ===========================================

export const CertificateId = S.UUID.pipe(S.brand('CertificateId'));
export type CertificateId = typeof CertificateId.Type;

// ===========================================
// Certificate Entity
// ===========================================

/**
 * Certificate - a completion certificate for a course
 *
 * Issued when a user completes all required lessons in a course.
 * Contains a snapshot of course/instructor info at time of completion.
 * Verification code allows public verification of authenticity.
 */
export class Certificate extends S.Class<Certificate>('Certificate')({
  id: CertificateId,
  enrollmentId: EnrollmentId,
  userId: UserId,
  courseId: CourseId,

  // Certificate details (snapshot at time of completion)
  recipientName: S.String,
  courseTitle: S.String,
  instructorName: S.String,

  // Verification
  verificationCode: S.String,

  // Issue date
  issuedAt: S.DateTimeUtc,

  // Timestamps
  createdAt: S.DateTimeUtc,
}) {}

// ===========================================
// Input Schemas
// ===========================================

/**
 * Input for issuing a certificate
 * (Usually called automatically on course completion)
 */
export class IssueCertificateInput extends S.Class<IssueCertificateInput>('IssueCertificateInput')({
  enrollmentId: EnrollmentId,
  recipientName: S.Trim.pipe(
    S.nonEmptyString({ message: () => 'Recipient name is required' }),
    S.maxLength(200),
  ),
}) {}

// ===========================================
// Query Types
// ===========================================

/**
 * Public certificate verification result
 */
export class CertificateVerification extends S.Class<CertificateVerification>(
  'CertificateVerification',
)({
  isValid: S.Boolean,
  certificate: S.optional(Certificate),
}) {}

// ===========================================
// Errors
// ===========================================

export class CertificateNotFoundError extends S.TaggedError<CertificateNotFoundError>(
  'CertificateNotFoundError',
)('CertificateNotFoundError', { id: CertificateId }, HttpApiSchema.annotations({ status: 404 })) {
  override get message() {
    return `Certificate with id ${this.id} not found`;
  }
}

export class CertificateAlreadyIssuedError extends S.TaggedError<CertificateAlreadyIssuedError>(
  'CertificateAlreadyIssuedError',
)(
  'CertificateAlreadyIssuedError',
  { enrollmentId: EnrollmentId },
  HttpApiSchema.annotations({ status: 409 }),
) {
  override get message() {
    return `Certificate already issued for enrollment ${this.enrollmentId}`;
  }
}

export class CourseNotCompletedError extends S.TaggedError<CourseNotCompletedError>(
  'CourseNotCompletedError',
)(
  'CourseNotCompletedError',
  { enrollmentId: EnrollmentId },
  HttpApiSchema.annotations({ status: 400 }),
) {
  override get message() {
    return `Course not completed for enrollment ${this.enrollmentId}`;
  }
}

export class InvalidVerificationCodeError extends S.TaggedError<InvalidVerificationCodeError>(
  'InvalidVerificationCodeError',
)('InvalidVerificationCodeError', { code: S.String }, HttpApiSchema.annotations({ status: 404 })) {
  override get message() {
    return `Invalid verification code: ${this.code}`;
  }
}
