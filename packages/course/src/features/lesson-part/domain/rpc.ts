import * as Rpc from '@effect/rpc/Rpc';
import * as RpcGroup from '@effect/rpc/RpcGroup';
import * as S from 'effect/Schema';
import {
  CreateLessonPartInput,
  LessonPart,
  LessonPartId,
  LessonPartNotFoundError,
  UpdateLessonPartInput,
} from './schema.js';
import { LessonId } from '../../lesson/domain/schema.js';

export class LessonPartRpc extends RpcGroup.make(
  // ─────────────────────────────────────────────────────────────────────────────
  // Queries
  // ─────────────────────────────────────────────────────────────────────────────

  Rpc.make('getById', {
    success: LessonPart,
    error: LessonPartNotFoundError,
    payload: { id: LessonPartId },
  }),

  Rpc.make('listByLesson', {
    success: S.Array(LessonPart),
    payload: { lessonId: LessonId },
  }),

  // ─────────────────────────────────────────────────────────────────────────────
  // Mutations
  // ─────────────────────────────────────────────────────────────────────────────

  Rpc.make('create', {
    success: LessonPart,
    payload: { input: CreateLessonPartInput },
  }),

  Rpc.make('update', {
    success: LessonPart,
    error: LessonPartNotFoundError,
    payload: { id: LessonPartId, input: UpdateLessonPartInput },
  }),

  Rpc.make('reorder', {
    success: S.Void,
    payload: { lessonId: LessonId, partIds: S.Array(LessonPartId) },
  }),

  Rpc.make('delete', {
    success: S.Void,
    error: LessonPartNotFoundError,
    payload: { id: LessonPartId },
  }),
).prefix('lessonPart_') {}
