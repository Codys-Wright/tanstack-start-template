import * as Rpc from '@effect/rpc/Rpc';
import * as RpcGroup from '@effect/rpc/RpcGroup';
import * as S from 'effect/Schema';
import { UserId } from '@auth';
import {
  CreateEnrollmentInput,
  Enrollment,
  EnrollmentId,
  EnrollmentNotFoundError,
  UpdateEnrollmentInput,
} from './schema.js';
import { CourseId } from '../../course/domain/schema.js';

export class EnrollmentRpc extends RpcGroup.make(
  // ─────────────────────────────────────────────────────────────────────────────
  // Queries
  // ─────────────────────────────────────────────────────────────────────────────

  Rpc.make('getById', {
    success: Enrollment,
    error: EnrollmentNotFoundError,
    payload: { id: EnrollmentId },
  }),

  Rpc.make('getByUserAndCourse', {
    success: S.NullOr(Enrollment),
    payload: { userId: UserId, courseId: CourseId },
  }),

  Rpc.make('listByUser', {
    success: S.Array(Enrollment),
    payload: { userId: UserId },
  }),

  Rpc.make('listByCourse', {
    success: S.Array(Enrollment),
    payload: { courseId: CourseId },
  }),

  Rpc.make('listActiveByUser', {
    success: S.Array(Enrollment),
    payload: { userId: UserId },
  }),

  Rpc.make('listMyEnrollments', {
    success: S.Array(Enrollment),
  }),

  Rpc.make('isEnrolled', {
    success: S.Boolean,
    payload: { courseId: CourseId },
  }),

  // ─────────────────────────────────────────────────────────────────────────────
  // Mutations
  // ─────────────────────────────────────────────────────────────────────────────

  Rpc.make('enroll', {
    success: Enrollment,
    payload: { input: CreateEnrollmentInput },
  }),

  Rpc.make('update', {
    success: Enrollment,
    error: EnrollmentNotFoundError,
    payload: { id: EnrollmentId, input: UpdateEnrollmentInput },
  }),

  Rpc.make('markCompleted', {
    success: Enrollment,
    error: EnrollmentNotFoundError,
    payload: { id: EnrollmentId },
  }),

  Rpc.make('cancel', {
    success: S.Void,
    error: EnrollmentNotFoundError,
    payload: { id: EnrollmentId },
  }),
).prefix('enrollment_') {}
