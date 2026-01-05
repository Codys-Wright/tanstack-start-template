import * as Rpc from '@effect/rpc/Rpc';
import * as RpcGroup from '@effect/rpc/RpcGroup';
import * as S from 'effect/Schema';
import { UserId } from '@auth';
import {
  Certificate,
  CertificateId,
  CertificateNotFoundError,
  CertificateVerification,
  IssueCertificateInput,
} from './schema.js';
import { CourseId, CourseNotFoundError } from '../../course/domain/schema.js';
import { EnrollmentId, EnrollmentNotFoundError } from '../../enrollment/domain/schema.js';
import { InstructorNotFoundError } from '../../instructor/domain/schema.js';

export class CertificateRpc extends RpcGroup.make(
  // ─────────────────────────────────────────────────────────────────────────────
  // Queries
  // ─────────────────────────────────────────────────────────────────────────────

  Rpc.make('getById', {
    success: Certificate,
    error: CertificateNotFoundError,
    payload: { id: CertificateId },
  }),

  Rpc.make('getByEnrollment', {
    success: S.NullOr(Certificate),
    payload: { enrollmentId: EnrollmentId },
  }),

  Rpc.make('verify', {
    success: CertificateVerification,
    payload: { code: S.String },
  }),

  Rpc.make('listByUser', {
    success: S.Array(Certificate),
    payload: { userId: UserId },
  }),

  Rpc.make('listMyCertificates', {
    success: S.Array(Certificate),
  }),

  Rpc.make('listByCourse', {
    success: S.Array(Certificate),
    payload: { courseId: CourseId },
  }),

  // ─────────────────────────────────────────────────────────────────────────────
  // Mutations
  // ─────────────────────────────────────────────────────────────────────────────

  Rpc.make('issue', {
    success: Certificate,
    error: S.Union(EnrollmentNotFoundError, CourseNotFoundError, InstructorNotFoundError),
    payload: { input: IssueCertificateInput },
  }),

  Rpc.make('delete', {
    success: S.Void,
    error: CertificateNotFoundError,
    payload: { id: CertificateId },
  }),
).prefix('certificate_') {}
