import { expect, it } from '@effect/vitest';
import * as BunContext from '@effect/platform-bun/BunContext';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as SqlClient from '@effect/sql/SqlClient';
import { makePgTestMigrations, withTransactionRollback } from '@core/database';
import { AuthMigrations } from '@auth/database';
import type { UserId } from '@auth';
import { CourseMigrations } from '../../../database/migrations.js';
import { ProgressRepository } from './repo.js';
import { EnrollmentRepository } from '../../enrollment/database/repo.js';
import { LessonRepository } from '../../lesson/database/repo.js';
import { SectionRepository } from '../../section/database/repo.js';
import { CourseRepository } from '../../course/database/repo.js';
import { InstructorRepository } from '../../instructor/database/repo.js';
import type { ProgressId } from '../domain/schema.js';
import { ProgressNotFoundError } from '../domain/schema.js';

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
  ProgressRepository.DefaultWithoutDependencies,
  EnrollmentRepository.DefaultWithoutDependencies,
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

it.layer(TestLayer, { timeout: 30_000 })('ProgressRepository', (it) => {
  it.scoped(
    'findByEnrollment - returns empty array when no progress exists',
    Effect.fn(function* () {
      const progressRepo = yield* ProgressRepository;
      const enrollmentRepo = yield* EnrollmentRepository;
      const courseRepo = yield* CourseRepository;
      const instructorRepo = yield* InstructorRepository;

      const userId = yield* insertTestUser('user-1');
      const instructorUserId = yield* insertTestUser('instructor-1');
      const instructor = yield* instructorRepo.create({
        userId: instructorUserId,
        displayName: 'Test Instructor',
      });
      const course = yield* courseRepo.create({
        instructorId: instructor.id,
        title: 'Test Course',
      });
      const enrollment = yield* enrollmentRepo.create({
        userId,
        courseId: course.id,
        source: 'free',
      });

      const progress = yield* progressRepo.findByEnrollment(enrollment.id);
      expect(progress.length).toBe(0);
    }, withTransactionRollback),
  );

  it.scoped(
    'findByEnrollment - returns all progress for an enrollment',
    Effect.fn(function* () {
      const progressRepo = yield* ProgressRepository;
      const enrollmentRepo = yield* EnrollmentRepository;
      const lessonRepo = yield* LessonRepository;
      const sectionRepo = yield* SectionRepository;
      const courseRepo = yield* CourseRepository;
      const instructorRepo = yield* InstructorRepository;

      const userId = yield* insertTestUser('user-1');
      const instructorUserId = yield* insertTestUser('instructor-1');
      const instructor = yield* instructorRepo.create({
        userId: instructorUserId,
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
      const enrollment = yield* enrollmentRepo.create({
        userId,
        courseId: course.id,
        source: 'free',
      });

      yield* progressRepo.getOrCreate(userId, lesson1.id, course.id, enrollment.id);
      yield* progressRepo.getOrCreate(userId, lesson2.id, course.id, enrollment.id);

      const progress = yield* progressRepo.findByEnrollment(enrollment.id);
      expect(progress.length).toBe(2);
    }, withTransactionRollback),
  );

  it.scoped(
    'findByUserAndCourse - returns progress for user and course',
    Effect.fn(function* () {
      const progressRepo = yield* ProgressRepository;
      const enrollmentRepo = yield* EnrollmentRepository;
      const lessonRepo = yield* LessonRepository;
      const sectionRepo = yield* SectionRepository;
      const courseRepo = yield* CourseRepository;
      const instructorRepo = yield* InstructorRepository;

      const userId = yield* insertTestUser('user-1');
      const instructorUserId = yield* insertTestUser('instructor-1');
      const instructor = yield* instructorRepo.create({
        userId: instructorUserId,
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
        title: 'Lesson 1',
        type: 'text',
      });
      const enrollment = yield* enrollmentRepo.create({
        userId,
        courseId: course.id,
        source: 'free',
      });

      yield* progressRepo.getOrCreate(userId, lesson.id, course.id, enrollment.id);

      const progress = yield* progressRepo.findByUserAndCourse(userId, course.id);
      expect(progress.length).toBe(1);
    }, withTransactionRollback),
  );

  it.scoped(
    'countCompletedByEnrollment - counts completed lessons',
    Effect.fn(function* () {
      const progressRepo = yield* ProgressRepository;
      const enrollmentRepo = yield* EnrollmentRepository;
      const lessonRepo = yield* LessonRepository;
      const sectionRepo = yield* SectionRepository;
      const courseRepo = yield* CourseRepository;
      const instructorRepo = yield* InstructorRepository;

      const userId = yield* insertTestUser('user-1');
      const instructorUserId = yield* insertTestUser('instructor-1');
      const instructor = yield* instructorRepo.create({
        userId: instructorUserId,
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
      const enrollment = yield* enrollmentRepo.create({
        userId,
        courseId: course.id,
        source: 'free',
      });

      const progress1 = yield* progressRepo.getOrCreate(
        userId,
        lesson1.id,
        course.id,
        enrollment.id,
      );
      const progress2 = yield* progressRepo.getOrCreate(
        userId,
        lesson2.id,
        course.id,
        enrollment.id,
      );
      yield* progressRepo.getOrCreate(userId, lesson3.id, course.id, enrollment.id);

      yield* progressRepo.markCompleted(progress1.id);
      yield* progressRepo.markCompleted(progress2.id);

      const count = yield* progressRepo.countCompletedByEnrollment(enrollment.id);
      expect(count).toBe(2);
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - returns progress when exists',
    Effect.fn(function* () {
      const progressRepo = yield* ProgressRepository;
      const enrollmentRepo = yield* EnrollmentRepository;
      const lessonRepo = yield* LessonRepository;
      const sectionRepo = yield* SectionRepository;
      const courseRepo = yield* CourseRepository;
      const instructorRepo = yield* InstructorRepository;

      const userId = yield* insertTestUser('user-1');
      const instructorUserId = yield* insertTestUser('instructor-1');
      const instructor = yield* instructorRepo.create({
        userId: instructorUserId,
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
        title: 'Lesson 1',
        type: 'text',
      });
      const enrollment = yield* enrollmentRepo.create({
        userId,
        courseId: course.id,
        source: 'free',
      });
      const progress = yield* progressRepo.getOrCreate(userId, lesson.id, course.id, enrollment.id);

      const found = yield* progressRepo.findById(progress.id);
      expect(found.id).toBe(progress.id);
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - fails with ProgressNotFoundError when not exists',
    Effect.fn(function* () {
      const progressRepo = yield* ProgressRepository;
      const fakeId = crypto.randomUUID() as ProgressId;

      const result = yield* progressRepo.findById(fakeId).pipe(Effect.either);

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(ProgressNotFoundError);
      }
    }, withTransactionRollback),
  );

  it.scoped(
    'findByUserAndLesson - returns progress when exists',
    Effect.fn(function* () {
      const progressRepo = yield* ProgressRepository;
      const enrollmentRepo = yield* EnrollmentRepository;
      const lessonRepo = yield* LessonRepository;
      const sectionRepo = yield* SectionRepository;
      const courseRepo = yield* CourseRepository;
      const instructorRepo = yield* InstructorRepository;

      const userId = yield* insertTestUser('user-1');
      const instructorUserId = yield* insertTestUser('instructor-1');
      const instructor = yield* instructorRepo.create({
        userId: instructorUserId,
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
        title: 'Lesson 1',
        type: 'text',
      });
      const enrollment = yield* enrollmentRepo.create({
        userId,
        courseId: course.id,
        source: 'free',
      });
      yield* progressRepo.getOrCreate(userId, lesson.id, course.id, enrollment.id);

      const found = yield* progressRepo.findByUserAndLesson(userId, lesson.id);
      expect(found).not.toBeNull();
      expect(found?.userId).toBe(userId);
      expect(found?.lessonId).toBe(lesson.id);
    }, withTransactionRollback),
  );

  it.scoped(
    'findByUserAndLesson - returns null when not exists',
    Effect.fn(function* () {
      const progressRepo = yield* ProgressRepository;
      const lessonRepo = yield* LessonRepository;
      const sectionRepo = yield* SectionRepository;
      const courseRepo = yield* CourseRepository;
      const instructorRepo = yield* InstructorRepository;

      const userId = yield* insertTestUser('user-1');
      const instructorUserId = yield* insertTestUser('instructor-1');
      const instructor = yield* instructorRepo.create({
        userId: instructorUserId,
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
        title: 'Lesson 1',
        type: 'text',
      });

      const found = yield* progressRepo.findByUserAndLesson(userId, lesson.id);
      expect(found).toBeNull();
    }, withTransactionRollback),
  );

  it.scoped(
    'getOrCreate - creates progress if not exists',
    Effect.fn(function* () {
      const progressRepo = yield* ProgressRepository;
      const enrollmentRepo = yield* EnrollmentRepository;
      const lessonRepo = yield* LessonRepository;
      const sectionRepo = yield* SectionRepository;
      const courseRepo = yield* CourseRepository;
      const instructorRepo = yield* InstructorRepository;

      const userId = yield* insertTestUser('user-1');
      const instructorUserId = yield* insertTestUser('instructor-1');
      const instructor = yield* instructorRepo.create({
        userId: instructorUserId,
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
        title: 'Lesson 1',
        type: 'text',
      });
      const enrollment = yield* enrollmentRepo.create({
        userId,
        courseId: course.id,
        source: 'free',
      });

      const progress = yield* progressRepo.getOrCreate(userId, lesson.id, course.id, enrollment.id);
      expect(progress.userId).toBe(userId);
      expect(progress.lessonId).toBe(lesson.id);
      expect(progress.status).toBe('not_started');
    }, withTransactionRollback),
  );

  it.scoped(
    'getOrCreate - returns existing progress',
    Effect.fn(function* () {
      const progressRepo = yield* ProgressRepository;
      const enrollmentRepo = yield* EnrollmentRepository;
      const lessonRepo = yield* LessonRepository;
      const sectionRepo = yield* SectionRepository;
      const courseRepo = yield* CourseRepository;
      const instructorRepo = yield* InstructorRepository;

      const userId = yield* insertTestUser('user-1');
      const instructorUserId = yield* insertTestUser('instructor-1');
      const instructor = yield* instructorRepo.create({
        userId: instructorUserId,
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
        title: 'Lesson 1',
        type: 'text',
      });
      const enrollment = yield* enrollmentRepo.create({
        userId,
        courseId: course.id,
        source: 'free',
      });

      const first = yield* progressRepo.getOrCreate(userId, lesson.id, course.id, enrollment.id);
      yield* progressRepo.markStarted(first.id);

      const second = yield* progressRepo.getOrCreate(userId, lesson.id, course.id, enrollment.id);
      expect(second.id).toBe(first.id);
      expect(second.status).toBe('in_progress');
    }, withTransactionRollback),
  );

  it.scoped(
    'markStarted - sets status to in_progress',
    Effect.fn(function* () {
      const progressRepo = yield* ProgressRepository;
      const enrollmentRepo = yield* EnrollmentRepository;
      const lessonRepo = yield* LessonRepository;
      const sectionRepo = yield* SectionRepository;
      const courseRepo = yield* CourseRepository;
      const instructorRepo = yield* InstructorRepository;

      const userId = yield* insertTestUser('user-1');
      const instructorUserId = yield* insertTestUser('instructor-1');
      const instructor = yield* instructorRepo.create({
        userId: instructorUserId,
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
        title: 'Lesson 1',
        type: 'text',
      });
      const enrollment = yield* enrollmentRepo.create({
        userId,
        courseId: course.id,
        source: 'free',
      });
      const progress = yield* progressRepo.getOrCreate(userId, lesson.id, course.id, enrollment.id);

      const started = yield* progressRepo.markStarted(progress.id);
      expect(started.status).toBe('in_progress');
      expect(started.startedAt).not.toBeNull();
    }, withTransactionRollback),
  );

  it.scoped(
    'markCompleted - sets status to completed',
    Effect.fn(function* () {
      const progressRepo = yield* ProgressRepository;
      const enrollmentRepo = yield* EnrollmentRepository;
      const lessonRepo = yield* LessonRepository;
      const sectionRepo = yield* SectionRepository;
      const courseRepo = yield* CourseRepository;
      const instructorRepo = yield* InstructorRepository;

      const userId = yield* insertTestUser('user-1');
      const instructorUserId = yield* insertTestUser('instructor-1');
      const instructor = yield* instructorRepo.create({
        userId: instructorUserId,
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
        title: 'Lesson 1',
        type: 'text',
      });
      const enrollment = yield* enrollmentRepo.create({
        userId,
        courseId: course.id,
        source: 'free',
      });
      const progress = yield* progressRepo.getOrCreate(userId, lesson.id, course.id, enrollment.id);

      const completed = yield* progressRepo.markCompleted(progress.id);
      expect(completed.status).toBe('completed');
      expect(completed.completedAt).not.toBeNull();
    }, withTransactionRollback),
  );

  it.scoped(
    'delete - removes progress',
    Effect.fn(function* () {
      const progressRepo = yield* ProgressRepository;
      const enrollmentRepo = yield* EnrollmentRepository;
      const lessonRepo = yield* LessonRepository;
      const sectionRepo = yield* SectionRepository;
      const courseRepo = yield* CourseRepository;
      const instructorRepo = yield* InstructorRepository;

      const userId = yield* insertTestUser('user-1');
      const instructorUserId = yield* insertTestUser('instructor-1');
      const instructor = yield* instructorRepo.create({
        userId: instructorUserId,
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
        title: 'Lesson 1',
        type: 'text',
      });
      const enrollment = yield* enrollmentRepo.create({
        userId,
        courseId: course.id,
        source: 'free',
      });
      const progress = yield* progressRepo.getOrCreate(userId, lesson.id, course.id, enrollment.id);

      yield* progressRepo.delete(progress.id);

      const found = yield* progressRepo.findByUserAndLesson(userId, lesson.id);
      expect(found).toBeNull();
    }, withTransactionRollback),
  );
});
