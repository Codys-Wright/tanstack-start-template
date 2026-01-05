import { expect, it } from '@effect/vitest';
import * as BunContext from '@effect/platform-bun/BunContext';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as SqlClient from '@effect/sql/SqlClient';
import { makePgTestMigrations, withTransactionRollback } from '@core/database';
import { AuthMigrations } from '@auth/database';
import type { UserId } from '@auth';
import { CourseMigrations } from '../../../database/migrations.js';
import { ReviewRepository } from './repo.js';
import { EnrollmentRepository } from '../../enrollment/database/repo.js';
import { CourseRepository } from '../../course/database/repo.js';
import { InstructorRepository } from '../../instructor/database/repo.js';
import type { ReviewId } from '../domain/schema.js';
import { ReviewNotFoundError } from '../domain/schema.js';

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
  ReviewRepository.DefaultWithoutDependencies,
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

it.layer(TestLayer, { timeout: 30_000 })('ReviewRepository', (it) => {
  it.scoped(
    'findByCourse - returns empty array when no reviews exist',
    Effect.fn(function* () {
      const reviewRepo = yield* ReviewRepository;
      const courseRepo = yield* CourseRepository;
      const instructorRepo = yield* InstructorRepository;

      const instructorUserId = yield* insertTestUser('instructor-1');
      const instructor = yield* instructorRepo.create({
        userId: instructorUserId,
        displayName: 'Test Instructor',
      });
      const course = yield* courseRepo.create({
        instructorId: instructor.id,
        title: 'Test Course',
      });

      const reviews = yield* reviewRepo.findByCourse(course.id);
      expect(reviews.length).toBe(0);
    }, withTransactionRollback),
  );

  it.scoped(
    'findByCourse - returns approved reviews for a course',
    Effect.fn(function* () {
      const reviewRepo = yield* ReviewRepository;
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

      // Create and approve a review
      const review = yield* reviewRepo.create(
        { courseId: course.id, rating: 5, title: 'Great!' },
        userId,
        enrollment.id,
      );
      yield* reviewRepo.approve(review.id);

      const reviews = yield* reviewRepo.findByCourse(course.id);
      expect(reviews.length).toBe(1);
      expect(reviews[0].rating).toBe(5);
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - returns review when exists',
    Effect.fn(function* () {
      const reviewRepo = yield* ReviewRepository;
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
      const review = yield* reviewRepo.create(
        { courseId: course.id, rating: 4, title: 'Good course' },
        userId,
        enrollment.id,
      );

      const found = yield* reviewRepo.findById(review.id);
      expect(found.id).toBe(review.id);
      expect(found.rating).toBe(4);
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - fails with ReviewNotFoundError when not exists',
    Effect.fn(function* () {
      const reviewRepo = yield* ReviewRepository;
      const fakeId = crypto.randomUUID() as ReviewId;

      const result = yield* reviewRepo.findById(fakeId).pipe(Effect.either);

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(ReviewNotFoundError);
      }
    }, withTransactionRollback),
  );

  it.scoped(
    'findByUserAndCourse - returns review when exists',
    Effect.fn(function* () {
      const reviewRepo = yield* ReviewRepository;
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
      yield* reviewRepo.create(
        { courseId: course.id, rating: 5, title: 'Great!' },
        userId,
        enrollment.id,
      );

      const found = yield* reviewRepo.findByUserAndCourse(userId, course.id);
      expect(found).not.toBeNull();
      expect(found?.userId).toBe(userId);
    }, withTransactionRollback),
  );

  it.scoped(
    'findByUserAndCourse - returns null when no review exists',
    Effect.fn(function* () {
      const reviewRepo = yield* ReviewRepository;
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

      const found = yield* reviewRepo.findByUserAndCourse(userId, course.id);
      expect(found).toBeNull();
    }, withTransactionRollback),
  );

  it.scoped(
    'create - inserts a new review',
    Effect.fn(function* () {
      const reviewRepo = yield* ReviewRepository;
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

      const review = yield* reviewRepo.create(
        {
          courseId: course.id,
          rating: 5,
          title: 'Amazing!',
          body: 'Loved it!',
        },
        userId,
        enrollment.id,
      );

      expect(review.courseId).toBe(course.id);
      expect(review.userId).toBe(userId);
      expect(review.rating).toBe(5);
      expect(review.title).toBe('Amazing!');
      expect(review.body).toBe('Loved it!');
      expect(review.isApproved).toBe(false); // Not approved by default
    }, withTransactionRollback),
  );

  it.scoped(
    'update - updates review fields',
    Effect.fn(function* () {
      const reviewRepo = yield* ReviewRepository;
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
      const review = yield* reviewRepo.create(
        { courseId: course.id, rating: 3, title: 'Ok' },
        userId,
        enrollment.id,
      );

      const updated = yield* reviewRepo.update(review.id, {
        rating: 4,
        title: 'Actually pretty good',
      });

      expect(updated.id).toBe(review.id);
      expect(updated.rating).toBe(4);
      expect(updated.title).toBe('Actually pretty good');
    }, withTransactionRollback),
  );

  it.scoped(
    'approve - sets isApproved to true',
    Effect.fn(function* () {
      const reviewRepo = yield* ReviewRepository;
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
      const review = yield* reviewRepo.create(
        { courseId: course.id, rating: 5 },
        userId,
        enrollment.id,
      );

      expect(review.isApproved).toBe(false);

      const approved = yield* reviewRepo.approve(review.id);
      expect(approved.isApproved).toBe(true);
    }, withTransactionRollback),
  );

  it.scoped(
    'setFeatured - sets isFeatured',
    Effect.fn(function* () {
      const reviewRepo = yield* ReviewRepository;
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
      const review = yield* reviewRepo.create(
        { courseId: course.id, rating: 5 },
        userId,
        enrollment.id,
      );

      const featured = yield* reviewRepo.setFeatured(review.id, true);
      expect(featured.isFeatured).toBe(true);

      const unfeatured = yield* reviewRepo.setFeatured(review.id, false);
      expect(unfeatured.isFeatured).toBe(false);
    }, withTransactionRollback),
  );

  it.scoped(
    'addInstructorResponse - adds response to review',
    Effect.fn(function* () {
      const reviewRepo = yield* ReviewRepository;
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
      const review = yield* reviewRepo.create(
        { courseId: course.id, rating: 5, body: 'Great course!' },
        userId,
        enrollment.id,
      );

      const withResponse = yield* reviewRepo.addInstructorResponse(
        review.id,
        'Thank you for your feedback!',
      );

      expect(withResponse.instructorResponse).toBe('Thank you for your feedback!');
      expect(withResponse.respondedAt).not.toBeNull();
    }, withTransactionRollback),
  );

  it.scoped(
    'delete - removes a review',
    Effect.fn(function* () {
      const reviewRepo = yield* ReviewRepository;
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
      const review = yield* reviewRepo.create(
        { courseId: course.id, rating: 5 },
        userId,
        enrollment.id,
      );

      yield* reviewRepo.delete(review.id);

      const found = yield* reviewRepo.findByUserAndCourse(userId, course.id);
      expect(found).toBeNull();
    }, withTransactionRollback),
  );
});
