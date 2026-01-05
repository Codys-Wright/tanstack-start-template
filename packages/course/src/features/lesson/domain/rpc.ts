import * as Rpc from '@effect/rpc/Rpc';
import * as RpcGroup from '@effect/rpc/RpcGroup';
import * as S from 'effect/Schema';
import {
  CreateLessonInput,
  Lesson,
  LessonId,
  LessonNotFoundError,
  UpdateLessonInput,
} from './schema.js';
import { CourseId } from '../../course/domain/schema.js';
import { SectionId } from '../../section/domain/schema.js';

export class LessonRpc extends RpcGroup.make(
  // ─────────────────────────────────────────────────────────────────────────────
  // Queries
  // ─────────────────────────────────────────────────────────────────────────────

  Rpc.make('getById', {
    success: Lesson,
    error: LessonNotFoundError,
    payload: { id: LessonId },
  }),

  Rpc.make('listBySection', {
    success: S.Array(Lesson),
    payload: { sectionId: SectionId },
  }),

  Rpc.make('listByCourse', {
    success: S.Array(Lesson),
    payload: { courseId: CourseId },
  }),

  Rpc.make('listFreePreview', {
    success: S.Array(Lesson),
    payload: { courseId: CourseId },
  }),

  // ─────────────────────────────────────────────────────────────────────────────
  // Mutations
  // ─────────────────────────────────────────────────────────────────────────────

  Rpc.make('create', {
    success: Lesson,
    payload: { input: CreateLessonInput },
  }),

  Rpc.make('update', {
    success: Lesson,
    error: LessonNotFoundError,
    payload: { id: LessonId, input: UpdateLessonInput },
  }),

  Rpc.make('reorder', {
    success: S.Void,
    payload: { sectionId: SectionId, lessonIds: S.Array(LessonId) },
  }),

  Rpc.make('delete', {
    success: S.Void,
    error: LessonNotFoundError,
    payload: { id: LessonId },
  }),
).prefix('lesson_') {}
