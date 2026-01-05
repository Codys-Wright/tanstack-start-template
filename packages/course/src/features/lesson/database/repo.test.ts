import { expect, it } from '@effect/vitest';
import * as BunContext from '@effect/platform-bun/BunContext';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as SqlClient from '@effect/sql/SqlClient';
import { makePgTestMigrations, withTransactionRollback } from '@core/database';
import { AuthMigrations } from '@auth/database';
import type { UserId } from '@auth';
import { CourseMigrations } from '../../../database/migrations.js';
import { LessonRepository } from './repo.js';
import { SectionRepository } from '../../section/database/repo.js';
import { CourseRepository } from '../../course/database/repo.js';
import { InstructorRepository } from '../../instructor/database/repo.js';
import type { LessonId } from '../domain/schema.js';
import { LessonNotFoundError } from '../domain/schema.js';

// Combine auth + course migrations into a single loader
const CombinedMigrations = Effect.gen(function* () {
  const authMigrations = yield* AuthMigrations;
  const courseMigrations = yield* CourseMigrations;
  const all = [...authMigrations, ...courseMigrations];
  return all.map((migration, index) => {
    const [_originalId, name, load] = migration;
    return [index + 1, name, load] as const;
  });
});

const PgTest = makePgTestMigrations(CombinedMigrations);

const TestLayer = Layer.mergeAll(
  LessonRepository.DefaultWithoutDependencies,
  SectionRepository.DefaultWithoutDependencies,
  CourseRepository.DefaultWithoutDependencies,
  InstructorRepository.DefaultWithoutDependencies,
).pipe(Layer.provideMerge(PgTest), Layer.provide(BunContext.layer));

// Helper for user table only (owned by @auth/Better Auth)
const insertTestUser = (id: string) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`INSERT INTO "user" (id, name, email, email_verified) VALUES (${id}, 'Test', ${`${id}@test.com`}, false)`;
    return id as UserId;
  });

it.layer(TestLayer, { timeout: 30_000 })('LessonRepository', (it) => {
  it.scoped(
    'findBySection - returns empty array when no lessons exist',
    Effect.fn(function* () {
      const lessonRepo = yield* LessonRepository;
      const sectionRepo = yield* SectionRepository;
      const courseRepo = yield* CourseRepository;
      const instructorRepo = yield* InstructorRepository;

      const userId = yield* insertTestUser('user-1');
      const instructor = yield* instructorRepo.create({
        userId,
        displayName: 'Test Instructor',
      });
      const course = yield* courseRepo.create({
        instructorId: instructor.id,
        title: 'Test Course',
      });
      const section = yield* sectionRepo.create({
        courseId: course.id,
        title: 'Test Section',
      });

      const lessons = yield* lessonRepo.findBySection(section.id);
      expect(lessons.length).toBe(0);
    }, withTransactionRollback),
  );

  it.scoped(
    'findBySection - returns lessons ordered by sort_order',
    Effect.fn(function* () {
      const lessonRepo = yield* LessonRepository;
      const sectionRepo = yield* SectionRepository;
      const courseRepo = yield* CourseRepository;
      const instructorRepo = yield* InstructorRepository;

      const userId = yield* insertTestUser('user-1');
      const instructor = yield* instructorRepo.create({
        userId,
        displayName: 'Test Instructor',
      });
      const course = yield* courseRepo.create({
        instructorId: instructor.id,
        title: 'Test Course',
      });
      const section = yield* sectionRepo.create({
        courseId: course.id,
        title: 'Test Section',
      });

      // Create lessons out of order - they auto-increment sortOrder
      yield* lessonRepo.create({
        sectionId: section.id,
        courseId: course.id,
        title: 'Lesson 1',
        type: 'text',
      });
      yield* lessonRepo.create({
        sectionId: section.id,
        courseId: course.id,
        title: 'Lesson 2',
        type: 'text',
      });
      yield* lessonRepo.create({
        sectionId: section.id,
        courseId: course.id,
        title: 'Lesson 3',
        type: 'text',
      });

      const lessons = yield* lessonRepo.findBySection(section.id);
      expect(lessons.length).toBe(3);
      expect(lessons[0].title).toBe('Lesson 1');
      expect(lessons[1].title).toBe('Lesson 2');
      expect(lessons[2].title).toBe('Lesson 3');
    }, withTransactionRollback),
  );

  it.scoped(
    'findByCourse - returns all lessons for a course',
    Effect.fn(function* () {
      const lessonRepo = yield* LessonRepository;
      const sectionRepo = yield* SectionRepository;
      const courseRepo = yield* CourseRepository;
      const instructorRepo = yield* InstructorRepository;

      const userId = yield* insertTestUser('user-1');
      const instructor = yield* instructorRepo.create({
        userId,
        displayName: 'Test Instructor',
      });
      const course = yield* courseRepo.create({
        instructorId: instructor.id,
        title: 'Test Course',
      });
      const section = yield* sectionRepo.create({
        courseId: course.id,
        title: 'Test Section',
      });

      yield* lessonRepo.create({
        sectionId: section.id,
        courseId: course.id,
        title: 'Lesson 1',
        type: 'text',
      });
      yield* lessonRepo.create({
        sectionId: section.id,
        courseId: course.id,
        title: 'Lesson 2',
        type: 'text',
      });

      const lessons = yield* lessonRepo.findByCourse(course.id);
      expect(lessons.length).toBe(2);
    }, withTransactionRollback),
  );

  it.scoped(
    'findFreePreviewLessons - returns only free or preview lessons',
    Effect.fn(function* () {
      const lessonRepo = yield* LessonRepository;
      const sectionRepo = yield* SectionRepository;
      const courseRepo = yield* CourseRepository;
      const instructorRepo = yield* InstructorRepository;

      const userId = yield* insertTestUser('user-1');
      const instructor = yield* instructorRepo.create({
        userId,
        displayName: 'Test Instructor',
      });
      const course = yield* courseRepo.create({
        instructorId: instructor.id,
        title: 'Test Course',
      });
      const section = yield* sectionRepo.create({
        courseId: course.id,
        title: 'Test Section',
      });

      yield* lessonRepo.create({
        sectionId: section.id,
        courseId: course.id,
        title: 'Free Lesson',
        type: 'text',
        isFree: true,
      });
      yield* lessonRepo.create({
        sectionId: section.id,
        courseId: course.id,
        title: 'Preview Lesson',
        type: 'text',
        isPreview: true,
      });
      yield* lessonRepo.create({
        sectionId: section.id,
        courseId: course.id,
        title: 'Paid Lesson',
        type: 'text',
      });

      const freeLessons = yield* lessonRepo.findFreePreviewLessons(course.id);
      expect(freeLessons.length).toBe(2);
      expect(freeLessons.map((l) => l.title).sort()).toEqual(['Free Lesson', 'Preview Lesson']);
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - returns lesson when exists',
    Effect.fn(function* () {
      const lessonRepo = yield* LessonRepository;
      const sectionRepo = yield* SectionRepository;
      const courseRepo = yield* CourseRepository;
      const instructorRepo = yield* InstructorRepository;

      const userId = yield* insertTestUser('user-1');
      const instructor = yield* instructorRepo.create({
        userId,
        displayName: 'Test Instructor',
      });
      const course = yield* courseRepo.create({
        instructorId: instructor.id,
        title: 'Test Course',
      });
      const section = yield* sectionRepo.create({
        courseId: course.id,
        title: 'Test Section',
      });
      const lesson = yield* lessonRepo.create({
        sectionId: section.id,
        courseId: course.id,
        title: 'Find Me',
        type: 'text',
      });

      const found = yield* lessonRepo.findById(lesson.id);
      expect(found.id).toBe(lesson.id);
      expect(found.title).toBe('Find Me');
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - fails with LessonNotFoundError when not exists',
    Effect.fn(function* () {
      const lessonRepo = yield* LessonRepository;
      const fakeId = crypto.randomUUID() as LessonId;

      const result = yield* lessonRepo.findById(fakeId).pipe(Effect.either);

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(LessonNotFoundError);
      }
    }, withTransactionRollback),
  );

  it.scoped(
    'create - inserts a new lesson with auto sort_order',
    Effect.fn(function* () {
      const lessonRepo = yield* LessonRepository;
      const sectionRepo = yield* SectionRepository;
      const courseRepo = yield* CourseRepository;
      const instructorRepo = yield* InstructorRepository;

      const userId = yield* insertTestUser('user-1');
      const instructor = yield* instructorRepo.create({
        userId,
        displayName: 'Test Instructor',
      });
      const course = yield* courseRepo.create({
        instructorId: instructor.id,
        title: 'Test Course',
      });
      const section = yield* sectionRepo.create({
        courseId: course.id,
        title: 'Test Section',
      });

      const lesson1 = yield* lessonRepo.create({
        sectionId: section.id,
        courseId: course.id,
        title: 'Lesson 1',
        type: 'text',
      });
      expect(lesson1.sortOrder).toBe(1);

      const lesson2 = yield* lessonRepo.create({
        sectionId: section.id,
        courseId: course.id,
        title: 'Lesson 2',
        type: 'text',
      });
      expect(lesson2.sortOrder).toBe(2);
    }, withTransactionRollback),
  );

  it.scoped(
    'update - updates lesson fields',
    Effect.fn(function* () {
      const lessonRepo = yield* LessonRepository;
      const sectionRepo = yield* SectionRepository;
      const courseRepo = yield* CourseRepository;
      const instructorRepo = yield* InstructorRepository;

      const userId = yield* insertTestUser('user-1');
      const instructor = yield* instructorRepo.create({
        userId,
        displayName: 'Test Instructor',
      });
      const course = yield* courseRepo.create({
        instructorId: instructor.id,
        title: 'Test Course',
      });
      const section = yield* sectionRepo.create({
        courseId: course.id,
        title: 'Test Section',
      });
      const lesson = yield* lessonRepo.create({
        sectionId: section.id,
        courseId: course.id,
        title: 'Original',
        type: 'text',
      });

      const updated = yield* lessonRepo.update(lesson.id, {
        title: 'Updated Title',
        description: 'New description',
        isFree: true,
      });

      expect(updated.id).toBe(lesson.id);
      expect(updated.title).toBe('Updated Title');
      expect(updated.description).toBe('New description');
      expect(updated.isFree).toBe(true);
    }, withTransactionRollback),
  );

  it.scoped(
    'reorder - reorders lessons',
    Effect.fn(function* () {
      const lessonRepo = yield* LessonRepository;
      const sectionRepo = yield* SectionRepository;
      const courseRepo = yield* CourseRepository;
      const instructorRepo = yield* InstructorRepository;

      const userId = yield* insertTestUser('user-1');
      const instructor = yield* instructorRepo.create({
        userId,
        displayName: 'Test Instructor',
      });
      const course = yield* courseRepo.create({
        instructorId: instructor.id,
        title: 'Test Course',
      });
      const section = yield* sectionRepo.create({
        courseId: course.id,
        title: 'Test Section',
      });

      const lesson1 = yield* lessonRepo.create({
        sectionId: section.id,
        courseId: course.id,
        title: 'Lesson 1',
        type: 'text',
      });
      const lesson2 = yield* lessonRepo.create({
        sectionId: section.id,
        courseId: course.id,
        title: 'Lesson 2',
        type: 'text',
      });
      const lesson3 = yield* lessonRepo.create({
        sectionId: section.id,
        courseId: course.id,
        title: 'Lesson 3',
        type: 'text',
      });

      // Reorder: 3, 1, 2
      yield* lessonRepo.reorder([lesson3.id, lesson1.id, lesson2.id]);

      const lessons = yield* lessonRepo.findBySection(section.id);
      expect(lessons[0].id).toBe(lesson3.id);
      expect(lessons[1].id).toBe(lesson1.id);
      expect(lessons[2].id).toBe(lesson2.id);
    }, withTransactionRollback),
  );

  it.scoped(
    'delete - removes a lesson',
    Effect.fn(function* () {
      const lessonRepo = yield* LessonRepository;
      const sectionRepo = yield* SectionRepository;
      const courseRepo = yield* CourseRepository;
      const instructorRepo = yield* InstructorRepository;

      const userId = yield* insertTestUser('user-1');
      const instructor = yield* instructorRepo.create({
        userId,
        displayName: 'Test Instructor',
      });
      const course = yield* courseRepo.create({
        instructorId: instructor.id,
        title: 'Test Course',
      });
      const section = yield* sectionRepo.create({
        courseId: course.id,
        title: 'Test Section',
      });
      const lesson = yield* lessonRepo.create({
        sectionId: section.id,
        courseId: course.id,
        title: 'To Delete',
        type: 'text',
      });

      const before = yield* lessonRepo.findBySection(section.id);
      expect(before.length).toBe(1);

      yield* lessonRepo.delete(lesson.id);

      const after = yield* lessonRepo.findBySection(section.id);
      expect(after.length).toBe(0);
    }, withTransactionRollback),
  );
});
