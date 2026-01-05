import { serializable } from '@core/client/atom-utils';
import { Atom, Result } from '@effect-atom/atom-react';
import * as RpcClientError from '@effect/rpc/RpcClientError';
import * as Arr from 'effect/Array';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as S from 'effect/Schema';
import { Category, CategoryId, CreateCategoryInput, UpdateCategoryInput } from '../domain/index.js';
import { CategoryClient } from './client.js';

const CategoriesSchema = S.Array(Category);

// ============================================================================
// Query Atoms
// ============================================================================

type CategoriesCacheUpdate = Data.TaggedEnum<{
  Upsert: { readonly category: Category };
  Delete: { readonly id: CategoryId };
}>;

/**
 * All categories atom with SSR support and optimistic updates.
 */
export const categoriesAtom = (() => {
  const remoteAtom = CategoryClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* CategoryClient;
        return yield* client('category_list', undefined);
      }),
    )
    .pipe(
      serializable({
        key: '@course/categories',
        schema: Result.Schema({
          success: CategoriesSchema,
          error: RpcClientError.RpcClientError,
        }),
      }),
    );

  return Object.assign(
    Atom.writable(
      (get) => get(remoteAtom),
      (ctx, update: CategoriesCacheUpdate) => {
        const current = ctx.get(categoriesAtom);
        if (!Result.isSuccess(current)) return;

        const nextValue = (() => {
          switch (update._tag) {
            case 'Upsert': {
              const existingIndex = Arr.findFirstIndex(
                current.value,
                (c) => c.id === update.category.id,
              );
              return Option.match(existingIndex, {
                onNone: () => Arr.prepend(current.value, update.category),
                onSome: (index) => Arr.replace(current.value, index, update.category),
              });
            }
            case 'Delete': {
              return Arr.filter(current.value, (c) => c.id !== update.id);
            }
          }
        })();

        ctx.setSelf(Result.success(nextValue));
      },
      (refresh) => {
        refresh(remoteAtom);
      },
    ),
    { remote: remoteAtom },
  );
})();

/**
 * Active categories (for display in UI)
 */
export const activeCategoriesAtom = CategoryClient.runtime
  .atom(
    Effect.gen(function* () {
      const client = yield* CategoryClient;
      return yield* client('category_listActive', undefined);
    }),
  )
  .pipe(
    serializable({
      key: '@course/categories/active',
      schema: Result.Schema({
        success: CategoriesSchema,
        error: RpcClientError.RpcClientError,
      }),
    }),
  );

/**
 * Top-level categories (no parent)
 */
export const topLevelCategoriesAtom = CategoryClient.runtime
  .atom(
    Effect.gen(function* () {
      const client = yield* CategoryClient;
      return yield* client('category_listTopLevel', undefined);
    }),
  )
  .pipe(
    serializable({
      key: '@course/categories/top-level',
      schema: Result.Schema({
        success: CategoriesSchema,
        error: RpcClientError.RpcClientError,
      }),
    }),
  );

// ============================================================================
// Mutation Atoms
// ============================================================================

/**
 * Create category with optimistic cache update.
 */
export const createCategoryAtom = CategoryClient.runtime.fn<CreateCategoryInput>()(
  Effect.fnUntraced(function* (input, get) {
    const client = yield* CategoryClient;
    const result = yield* client('category_create', { input });
    get.set(categoriesAtom, { _tag: 'Upsert', category: result });
    return result;
  }),
);

/**
 * Update category with optimistic cache update.
 */
export const updateCategoryAtom = CategoryClient.runtime.fn<{
  readonly id: CategoryId;
  readonly input: UpdateCategoryInput;
}>()(
  Effect.fnUntraced(function* ({ id, input }, get) {
    const client = yield* CategoryClient;
    const result = yield* client('category_update', { id, input });
    get.set(categoriesAtom, { _tag: 'Upsert', category: result });
    return result;
  }),
);

/**
 * Delete category with optimistic cache update.
 */
export const deleteCategoryAtom = CategoryClient.runtime.fn<CategoryId>()(
  Effect.fnUntraced(function* (id, get) {
    const client = yield* CategoryClient;
    yield* client('category_delete', { id });
    get.set(categoriesAtom, { _tag: 'Delete', id });
  }),
);
