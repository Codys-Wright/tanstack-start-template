import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { CategoryRpc } from '../domain/index.js';
import { CategoryService } from './service.js';

export const CategoryRpcLive = CategoryRpc.toLayer(
  Effect.gen(function* () {
    const categories = yield* CategoryService;

    return CategoryRpc.of({
      category_list: Effect.fn('CategoryRpc.list')(function* () {
        yield* Effect.log('[RPC] Listing all categories');
        return yield* categories.list();
      }),

      category_listActive: Effect.fn('CategoryRpc.listActive')(function* () {
        yield* Effect.log('[RPC] Listing active categories');
        return yield* categories.listActive();
      }),

      category_listTopLevel: Effect.fn('CategoryRpc.listTopLevel')(function* () {
        yield* Effect.log('[RPC] Listing top-level categories');
        return yield* categories.listTopLevel();
      }),

      category_getById: Effect.fn('CategoryRpc.getById')(function* ({ id }) {
        yield* Effect.log(`[RPC] Getting category by id: ${id}`);
        return yield* categories.getById(id);
      }),

      category_getBySlug: Effect.fn('CategoryRpc.getBySlug')(function* ({ slug }) {
        yield* Effect.log(`[RPC] Getting category by slug: ${slug}`);
        return yield* categories.getBySlug(slug);
      }),

      category_getChildren: Effect.fn('CategoryRpc.getChildren')(function* ({ parentId }) {
        yield* Effect.log(`[RPC] Getting children of category: ${parentId}`);
        return yield* categories.getChildren(parentId);
      }),

      category_create: Effect.fn('CategoryRpc.create')(function* ({ input }) {
        yield* Effect.log(`[RPC] Creating category: ${input.name}`);
        return yield* categories.create(input);
      }),

      category_update: Effect.fn('CategoryRpc.update')(function* ({ id, input }) {
        yield* Effect.log(`[RPC] Updating category: ${id}`);
        return yield* categories.update(id, input);
      }),

      category_delete: Effect.fn('CategoryRpc.delete')(function* ({ id }) {
        yield* Effect.log(`[RPC] Deleting category: ${id}`);
        return yield* categories.delete(id);
      }),
    });
  }),
).pipe(Layer.provide(CategoryService.Default));
