import * as Rpc from '@effect/rpc/Rpc';
import * as RpcGroup from '@effect/rpc/RpcGroup';
import * as S from 'effect/Schema';
import {
  CreateSectionInput,
  Section,
  SectionId,
  SectionNotFoundError,
  UpdateSectionInput,
} from './schema.js';
import { CourseId } from '../../course/domain/schema.js';

export class SectionRpc extends RpcGroup.make(
  // ─────────────────────────────────────────────────────────────────────────────
  // Queries
  // ─────────────────────────────────────────────────────────────────────────────

  Rpc.make('getById', {
    success: Section,
    error: SectionNotFoundError,
    payload: { id: SectionId },
  }),

  Rpc.make('listByCourse', {
    success: S.Array(Section),
    payload: { courseId: CourseId },
  }),

  // ─────────────────────────────────────────────────────────────────────────────
  // Mutations
  // ─────────────────────────────────────────────────────────────────────────────

  Rpc.make('create', {
    success: Section,
    payload: { input: CreateSectionInput },
  }),

  Rpc.make('update', {
    success: Section,
    error: SectionNotFoundError,
    payload: { id: SectionId, input: UpdateSectionInput },
  }),

  Rpc.make('reorder', {
    success: S.Void,
    payload: { courseId: CourseId, sectionIds: S.Array(SectionId) },
  }),

  Rpc.make('delete', {
    success: S.Void,
    error: SectionNotFoundError,
    payload: { id: SectionId },
  }),
).prefix('section_') {}
