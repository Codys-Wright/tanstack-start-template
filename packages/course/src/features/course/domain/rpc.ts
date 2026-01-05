import * as Rpc from '@effect/rpc/Rpc';
import * as RpcGroup from '@effect/rpc/RpcGroup';
import * as S from 'effect/Schema';
import {
  Course,
  CourseId,
  CourseNotFoundError,
  CreateCourseInput,
  UpdateCourseInput,
} from './schema.js';
import { CategoryId } from '../../category/domain/schema.js';
import { InstructorId } from '../../instructor/domain/schema.js';

export class CourseRpc extends RpcGroup.make(
  // ─────────────────────────────────────────────────────────────────────────────
  // Queries
  // ─────────────────────────────────────────────────────────────────────────────

  Rpc.make('list', {
    success: S.Array(Course),
  }),

  Rpc.make('listPublished', {
    success: S.Array(Course),
  }),

  Rpc.make('getById', {
    success: Course,
    error: CourseNotFoundError,
    payload: { id: CourseId },
  }),

  Rpc.make('getBySlug', {
    success: Course,
    error: CourseNotFoundError,
    payload: { slug: S.String },
  }),

  Rpc.make('listByInstructor', {
    success: S.Array(Course),
    payload: { instructorId: InstructorId },
  }),

  Rpc.make('listByCategory', {
    success: S.Array(Course),
    payload: { categoryId: CategoryId },
  }),

  Rpc.make('listMyCreatedCourses', {
    success: S.Array(Course),
  }),

  // ─────────────────────────────────────────────────────────────────────────────
  // Mutations
  // ─────────────────────────────────────────────────────────────────────────────

  Rpc.make('create', {
    success: Course,
    payload: { input: CreateCourseInput },
  }),

  Rpc.make('update', {
    success: Course,
    error: CourseNotFoundError,
    payload: { id: CourseId, input: UpdateCourseInput },
  }),

  Rpc.make('publish', {
    success: Course,
    error: CourseNotFoundError,
    payload: { id: CourseId },
  }),

  Rpc.make('archive', {
    success: Course,
    error: CourseNotFoundError,
    payload: { id: CourseId },
  }),

  Rpc.make('delete', {
    success: S.Void,
    error: CourseNotFoundError,
    payload: { id: CourseId },
  }),
).prefix('course_') {}
