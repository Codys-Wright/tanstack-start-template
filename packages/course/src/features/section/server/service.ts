import * as Effect from 'effect/Effect';
import { SectionRepository } from '../database/repo.js';
import type { CourseId } from '../../course/domain/schema.js';
import type { CreateSectionInput, SectionId, UpdateSectionInput } from '../domain/index.js';

export class SectionService extends Effect.Service<SectionService>()('@course/SectionService', {
  dependencies: [SectionRepository.Default],
  effect: Effect.gen(function* () {
    const repo = yield* SectionRepository;

    return {
      getById: (id: SectionId) => repo.findById(id),
      listByCourse: (courseId: CourseId) => repo.findByCourse(courseId),
      create: (input: CreateSectionInput) => repo.create(input),
      update: (id: SectionId, input: UpdateSectionInput) => repo.update(id, input),
      reorder: (sectionIds: readonly SectionId[]) => repo.reorder([...sectionIds]),
      delete: (id: SectionId) => repo.delete(id),
    } as const;
  }),
}) {}
