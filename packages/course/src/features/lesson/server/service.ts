import * as Effect from 'effect/Effect';
import { LessonRepository } from '../database/repo.js';
import type { CourseId } from '../../course/domain/schema.js';
import type { SectionId } from '../../section/domain/schema.js';
import type { CreateLessonInput, LessonId, UpdateLessonInput } from '../domain/index.js';

export class LessonService extends Effect.Service<LessonService>()('@course/LessonService', {
  dependencies: [LessonRepository.Default],
  effect: Effect.gen(function* () {
    const repo = yield* LessonRepository;

    return {
      getById: (id: LessonId) => repo.findById(id),
      listBySection: (sectionId: SectionId) => repo.findBySection(sectionId),
      listByCourse: (courseId: CourseId) => repo.findByCourse(courseId),
      listFreePreview: (courseId: CourseId) => repo.findFreePreviewLessons(courseId),
      create: (input: CreateLessonInput) => repo.create(input),
      update: (id: LessonId, input: UpdateLessonInput) => repo.update(id, input),
      reorder: (lessonIds: readonly LessonId[]) => repo.reorder([...lessonIds]),
      delete: (id: LessonId) => repo.delete(id),
    } as const;
  }),
}) {}
