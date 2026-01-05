import * as Effect from 'effect/Effect';
import { CategoryRepository } from '../database/repo.js';
import type { CategoryId, CreateCategoryInput, UpdateCategoryInput } from '../domain/index.js';

export class CategoryService extends Effect.Service<CategoryService>()('@course/CategoryService', {
  dependencies: [CategoryRepository.Default],
  effect: Effect.gen(function* () {
    const repo = yield* CategoryRepository;

    return {
      list: () => repo.findAll(),
      listActive: () => repo.findActive(),
      listTopLevel: () => repo.findByParent(null),
      getById: (id: CategoryId) => repo.findById(id),
      getBySlug: (slug: string) => repo.findBySlug(slug),
      getChildren: (parentId: CategoryId) => repo.findByParent(parentId),
      create: (input: CreateCategoryInput) => repo.create(input),
      update: (id: CategoryId, input: UpdateCategoryInput) => repo.update(id, input),
      delete: (id: CategoryId) => repo.delete(id),
    } as const;
  }),
}) {}
