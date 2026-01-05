import * as Rpc from '@effect/rpc/Rpc';
import * as RpcGroup from '@effect/rpc/RpcGroup';
import * as S from 'effect/Schema';
import { UserId } from '@auth';
import {
  CreateInstructorInput,
  InstructorId,
  InstructorNotFoundError,
  InstructorProfile,
  UpdateInstructorInput,
} from './schema.js';

export class InstructorRpc extends RpcGroup.make(
  // ─────────────────────────────────────────────────────────────────────────────
  // Queries
  // ─────────────────────────────────────────────────────────────────────────────

  Rpc.make('list', {
    success: S.Array(InstructorProfile),
  }),

  Rpc.make('listApproved', {
    success: S.Array(InstructorProfile),
  }),

  Rpc.make('getById', {
    success: InstructorProfile,
    error: InstructorNotFoundError,
    payload: { id: InstructorId },
  }),

  Rpc.make('getByUserId', {
    success: S.NullOr(InstructorProfile),
    payload: { userId: UserId },
  }),

  Rpc.make('getMyProfile', {
    success: S.NullOr(InstructorProfile),
  }),

  // ─────────────────────────────────────────────────────────────────────────────
  // Mutations
  // ─────────────────────────────────────────────────────────────────────────────

  Rpc.make('apply', {
    success: InstructorProfile,
    payload: { input: CreateInstructorInput },
  }),

  Rpc.make('update', {
    success: InstructorProfile,
    error: InstructorNotFoundError,
    payload: { id: InstructorId, input: UpdateInstructorInput },
  }),

  Rpc.make('approve', {
    success: InstructorProfile,
    error: InstructorNotFoundError,
    payload: { id: InstructorId },
  }),

  Rpc.make('suspend', {
    success: InstructorProfile,
    error: InstructorNotFoundError,
    payload: { id: InstructorId },
  }),
).prefix('instructor_') {}
