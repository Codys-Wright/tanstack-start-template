import { UserId } from '@auth';
import * as Effect from 'effect/Effect';
import { CourseRepository } from '../database/repo.js';
import { InstructorRepository } from '../../instructor/database/repo.js';
import type { CategoryId } from '../../category/domain/schema.js';
import type { InstructorId } from '../../instructor/domain/schema.js';
import type { CourseId, CreateCourseInput, UpdateCourseInput } from '../domain/index.js';

export class CourseService extends Effect.Service<CourseService>()('@course/CourseService', {
  dependencies: [CourseRepository.Default],
  effect: Effect.gen(function* () {
    const repo = yield* CourseRepository;

    return {
      list: () => repo.findAll(),
      listPublished: () => repo.findPublished(),
      getById: (id: CourseId) => repo.findById(id),
      getBySlug: (slug: string) => repo.findBySlug(slug),
      listByInstructor: (instructorId: InstructorId) => repo.findByInstructor(instructorId),
      listByCategory: (categoryId: CategoryId) => repo.findByCategory(categoryId),
      // For listMyCreatedCourses - requires InstructorRepository to be provided separately
      listByUserInstructor: (userId: UserId) =>
        Effect.flatMap(InstructorRepository, (instructorRepo) =>
          instructorRepo
            .findByUserId(userId)
            .pipe(
              Effect.flatMap((instructor) =>
                instructor ? repo.findByInstructor(instructor.id) : Effect.succeed([]),
              ),
            ),
        ),
      create: (input: CreateCourseInput) => repo.create(input),
      update: (id: CourseId, input: UpdateCourseInput) => repo.update(id, input),
      publish: (id: CourseId) => repo.publish(id),
      archive: (id: CourseId) => repo.archive(id),
      delete: (id: CourseId) => repo.delete(id),
    } as const;
  }),
}) {}
