import { expect, it } from '@effect/vitest';
import * as BunContext from '@effect/platform-bun/BunContext';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as SqlClient from '@effect/sql/SqlClient';
import { makePgTestMigrations, withTransactionRollback } from '@core/database';
import { AuthMigrations } from '@auth/database';
import type { UserId } from '@auth';
import { CourseMigrations } from '../../../database/migrations.js';
import { EnrollmentRepository } from './repo.js';
import { CourseRepository } from '../../course/database/repo.js';
import { InstructorRepository } from '../../instructor/database/repo.js';
import type { EnrollmentId } from '../domain/schema.js';
import { EnrollmentNotFoundError } from '../domain/schema.js';

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
  EnrollmentRepository.DefaultWithoutDependencies,
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

it.layer(TestLayer, { timeout: 30_000 })('EnrollmentRepository', (it) => {
  it.scoped(
    'findByUser - returns empty array when no enrollments exist',
    Effect.fn(function* () {
      const enrollmentRepo = yield* EnrollmentRepository;
      const userId = yield* insertTestUser('user-1');

      const enrollments = yield* enrollmentRepo.findByUser(userId);
      expect(enrollments.length).toBe(0);
    }, withTransactionRollback),
  );

  it.scoped(
    'findByUser - returns all enrollments for a user',
    Effect.fn(function* () {
      const enrollmentRepo = yield* EnrollmentRepository;
      const courseRepo = yield* CourseRepository;
      const instructorRepo = yield* InstructorRepository;

      const userId = yield* insertTestUser('user-1');
      const instructorUserId = yield* insertTestUser('instructor-1');
      const instructor = yield* instructorRepo.create({
        userId: instructorUserId,
        displayName: 'Test Instructor',
      });
      const course1 = yield* courseRepo.create({
        instructorId: instructor.id,
        title: 'Course 1',
      });
      const course2 = yield* courseRepo.create({
        instructorId: instructor.id,
        title: 'Course 2',
      });

      yield* enrollmentRepo.create({
        userId,
        courseId: course1.id,
        source: 'free',
      });
      yield* enrollmentRepo.create({
        userId,
        courseId: course2.id,
        source: 'free',
      });

      const enrollments = yield* enrollmentRepo.findByUser(userId);
      expect(enrollments.length).toBe(2);
    }, withTransactionRollback),
  );

  it.scoped(
    'findByCourse - returns all enrollments for a course',
    Effect.fn(function* () {
      const enrollmentRepo = yield* EnrollmentRepository;
      const courseRepo = yield* CourseRepository;
      const instructorRepo = yield* InstructorRepository;

      const user1 = yield* insertTestUser('user-1');
      const user2 = yield* insertTestUser('user-2');
      const instructorUserId = yield* insertTestUser('instructor-1');
      const instructor = yield* instructorRepo.create({
        userId: instructorUserId,
        displayName: 'Test Instructor',
      });
      const course = yield* courseRepo.create({
        instructorId: instructor.id,
        title: 'Test Course',
      });

      yield* enrollmentRepo.create({
        userId: user1,
        courseId: course.id,
        source: 'free',
      });
      yield* enrollmentRepo.create({
        userId: user2,
        courseId: course.id,
        source: 'free',
      });

      const enrollments = yield* enrollmentRepo.findByCourse(course.id);
      expect(enrollments.length).toBe(2);
    }, withTransactionRollback),
  );

  it.scoped(
    'findActiveByUser - returns only active enrollments',
    Effect.fn(function* () {
      const enrollmentRepo = yield* EnrollmentRepository;
      const courseRepo = yield* CourseRepository;
      const instructorRepo = yield* InstructorRepository;

      const userId = yield* insertTestUser('user-1');
      const instructorUserId = yield* insertTestUser('instructor-1');
      const instructor = yield* instructorRepo.create({
        userId: instructorUserId,
        displayName: 'Test Instructor',
      });
      const course1 = yield* courseRepo.create({
        instructorId: instructor.id,
        title: 'Course 1',
      });
      const course2 = yield* courseRepo.create({
        instructorId: instructor.id,
        title: 'Course 2',
      });

      yield* enrollmentRepo.create({
        userId,
        courseId: course1.id,
        source: 'free',
      });
      const enrollment2 = yield* enrollmentRepo.create({
        userId,
        courseId: course2.id,
        source: 'free',
      });
      // Expire the second enrollment
      yield* enrollmentRepo.update(enrollment2.id, { status: 'expired' });

      const activeEnrollments = yield* enrollmentRepo.findActiveByUser(userId);
      expect(activeEnrollments.length).toBe(1);
      expect(activeEnrollments[0].status).toBe('active');
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - returns enrollment when exists',
    Effect.fn(function* () {
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

      const found = yield* enrollmentRepo.findById(enrollment.id);
      expect(found.id).toBe(enrollment.id);
      expect(found.userId).toBe(userId);
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - fails with EnrollmentNotFoundError when not exists',
    Effect.fn(function* () {
      const enrollmentRepo = yield* EnrollmentRepository;
      const fakeId = crypto.randomUUID() as EnrollmentId;

      const result = yield* enrollmentRepo.findById(fakeId).pipe(Effect.either);

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(EnrollmentNotFoundError);
      }
    }, withTransactionRollback),
  );

  it.scoped(
    'findByUserAndCourse - returns enrollment when exists',
    Effect.fn(function* () {
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
      yield* enrollmentRepo.create({
        userId,
        courseId: course.id,
        source: 'free',
      });

      const found = yield* enrollmentRepo.findByUserAndCourse(userId, course.id);
      expect(found).not.toBeNull();
      expect(found?.userId).toBe(userId);
      expect(found?.courseId).toBe(course.id);
    }, withTransactionRollback),
  );

  it.scoped(
    'findByUserAndCourse - returns null when not enrolled',
    Effect.fn(function* () {
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

      const found = yield* enrollmentRepo.findByUserAndCourse(userId, course.id);
      expect(found).toBeNull();
    }, withTransactionRollback),
  );

  it.scoped(
    'isEnrolled - returns true when actively enrolled',
    Effect.fn(function* () {
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
      yield* enrollmentRepo.create({
        userId,
        courseId: course.id,
        source: 'free',
      });

      const isEnrolled = yield* enrollmentRepo.isEnrolled(userId, course.id);
      expect(isEnrolled).toBe(true);
    }, withTransactionRollback),
  );

  it.scoped(
    'isEnrolled - returns false when not enrolled',
    Effect.fn(function* () {
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

      const isEnrolled = yield* enrollmentRepo.isEnrolled(userId, course.id);
      expect(isEnrolled).toBe(false);
    }, withTransactionRollback),
  );

  it.scoped(
    'create - inserts a new enrollment',
    Effect.fn(function* () {
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

      expect(enrollment.userId).toBe(userId);
      expect(enrollment.courseId).toBe(course.id);
      expect(enrollment.status).toBe('active');
      expect(enrollment.source).toBe('free');
    }, withTransactionRollback),
  );

  it.scoped(
    'update - updates enrollment status',
    Effect.fn(function* () {
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

      const updated = yield* enrollmentRepo.update(enrollment.id, {
        status: 'expired',
      });

      expect(updated.id).toBe(enrollment.id);
      expect(updated.status).toBe('expired');
    }, withTransactionRollback),
  );

  it.scoped(
    'markCompleted - marks enrollment as completed',
    Effect.fn(function* () {
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

      const completed = yield* enrollmentRepo.markCompleted(enrollment.id);

      expect(completed.id).toBe(enrollment.id);
      expect(completed.progressPercent).toBe(100);
      expect(completed.completedAt).not.toBeNull();
    }, withTransactionRollback),
  );

  it.scoped(
    'delete - removes an enrollment',
    Effect.fn(function* () {
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

      yield* enrollmentRepo.delete(enrollment.id);

      const enrollments = yield* enrollmentRepo.findByUser(userId);
      expect(enrollments.length).toBe(0);
    }, withTransactionRollback),
  );
});
