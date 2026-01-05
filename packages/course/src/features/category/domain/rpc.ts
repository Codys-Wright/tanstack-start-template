import * as Rpc from '@effect/rpc/Rpc';
import * as RpcGroup from '@effect/rpc/RpcGroup';
import * as S from 'effect/Schema';
import {
  Category,
  CategoryId,
  CategoryNotFoundError,
  CreateCategoryInput,
  UpdateCategoryInput,
} from './schema.js';

export class CategoryRpc extends RpcGroup.make(
  // ─────────────────────────────────────────────────────────────────────────────
  // Queries
  // ─────────────────────────────────────────────────────────────────────────────

  Rpc.make('list', {
    success: S.Array(Category),
  }),

  Rpc.make('listActive', {
    success: S.Array(Category),
  }),

  Rpc.make('listTopLevel', {
    success: S.Array(Category),
  }),

  Rpc.make('getById', {
    success: Category,
    error: CategoryNotFoundError,
    payload: { id: CategoryId },
  }),

  Rpc.make('getBySlug', {
    success: Category,
    error: CategoryNotFoundError,
    payload: { slug: S.String },
  }),

  Rpc.make('getChildren', {
    success: S.Array(Category),
    payload: { parentId: CategoryId },
  }),

  // ─────────────────────────────────────────────────────────────────────────────
  // Mutations
  // ─────────────────────────────────────────────────────────────────────────────

  Rpc.make('create', {
    success: Category,
    payload: { input: CreateCategoryInput },
  }),

  Rpc.make('update', {
    success: Category,
    error: CategoryNotFoundError,
    payload: { id: CategoryId, input: UpdateCategoryInput },
  }),

  Rpc.make('delete', {
    success: S.Void,
    error: CategoryNotFoundError,
    payload: { id: CategoryId },
  }),
).prefix('category_') {}
