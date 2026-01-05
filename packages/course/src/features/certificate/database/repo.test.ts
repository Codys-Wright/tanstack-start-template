import { expect, it } from '@effect/vitest';
import * as BunContext from '@effect/platform-bun/BunContext';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as SqlClient from '@effect/sql/SqlClient';
import { makePgTestMigrations, withTransactionRollback } from '@core/database';
import { AuthMigrations } from '@auth/database';
import type { UserId } from '@auth';
import { CourseMigrations } from '../../../database/migrations.js';
import { CertificateRepository } from './repo.js';
import { EnrollmentRepository } from '../../enrollment/database/repo.js';
import { CourseRepository } from '../../course/database/repo.js';
import { InstructorRepository } from '../../instructor/database/repo.js';
import type { CertificateId } from '../domain/schema.js';
import { CertificateNotFoundError } from '../domain/schema.js';

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
  CertificateRepository.DefaultWithoutDependencies,
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

it.layer(TestLayer, { timeout: 30_000 })('CertificateRepository', (it) => {
  it.scoped(
    'findByUser - returns empty array when no certificates exist',
    Effect.fn(function* () {
      const certRepo = yield* CertificateRepository;
      const userId = yield* insertTestUser('user-1');

      const certs = yield* certRepo.findByUser(userId);
      expect(certs.length).toBe(0);
    }, withTransactionRollback),
  );

  it.scoped(
    'findByUser - returns all certificates for a user',
    Effect.fn(function* () {
      const certRepo = yield* CertificateRepository;
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
      const enrollment1 = yield* enrollmentRepo.create({
        userId,
        courseId: course1.id,
        source: 'free',
      });
      const enrollment2 = yield* enrollmentRepo.create({
        userId,
        courseId: course2.id,
        source: 'free',
      });

      yield* certRepo.issue(
        { enrollmentId: enrollment1.id, recipientName: 'Test User' },
        userId,
        course1.id,
        'Course 1',
        'Test Instructor',
      );
      yield* certRepo.issue(
        { enrollmentId: enrollment2.id, recipientName: 'Test User' },
        userId,
        course2.id,
        'Course 2',
        'Test Instructor',
      );

      const certs = yield* certRepo.findByUser(userId);
      expect(certs.length).toBe(2);
    }, withTransactionRollback),
  );

  it.scoped(
    'findByCourse - returns all certificates for a course',
    Effect.fn(function* () {
      const certRepo = yield* CertificateRepository;
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
      const enrollment1 = yield* enrollmentRepo.create({
        userId: user1,
        courseId: course.id,
        source: 'free',
      });
      const enrollment2 = yield* enrollmentRepo.create({
        userId: user2,
        courseId: course.id,
        source: 'free',
      });

      yield* certRepo.issue(
        { enrollmentId: enrollment1.id, recipientName: 'User 1' },
        user1,
        course.id,
        'Test Course',
        'Test Instructor',
      );
      yield* certRepo.issue(
        { enrollmentId: enrollment2.id, recipientName: 'User 2' },
        user2,
        course.id,
        'Test Course',
        'Test Instructor',
      );

      const certs = yield* certRepo.findByCourse(course.id);
      expect(certs.length).toBe(2);
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - returns certificate when exists',
    Effect.fn(function* () {
      const certRepo = yield* CertificateRepository;
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
      const cert = yield* certRepo.issue(
        { enrollmentId: enrollment.id, recipientName: 'Test User' },
        userId,
        course.id,
        'Test Course',
        'Test Instructor',
      );

      const found = yield* certRepo.findById(cert.id);
      expect(found.id).toBe(cert.id);
      expect(found.recipientName).toBe('Test User');
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - fails with CertificateNotFoundError when not exists',
    Effect.fn(function* () {
      const certRepo = yield* CertificateRepository;
      const fakeId = crypto.randomUUID() as CertificateId;

      const result = yield* certRepo.findById(fakeId).pipe(Effect.either);

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(CertificateNotFoundError);
      }
    }, withTransactionRollback),
  );

  it.scoped(
    'findByVerificationCode - returns certificate when valid code',
    Effect.fn(function* () {
      const certRepo = yield* CertificateRepository;
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
      const cert = yield* certRepo.issue(
        { enrollmentId: enrollment.id, recipientName: 'Test User' },
        userId,
        course.id,
        'Test Course',
        'Test Instructor',
      );

      const found = yield* certRepo.findByVerificationCode(cert.verificationCode);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(cert.id);
    }, withTransactionRollback),
  );

  it.scoped(
    'findByVerificationCode - returns null for invalid code',
    Effect.fn(function* () {
      const certRepo = yield* CertificateRepository;

      const found = yield* certRepo.findByVerificationCode('INVALID-CODE-1234');
      expect(found).toBeNull();
    }, withTransactionRollback),
  );

  it.scoped(
    'findByEnrollment - returns certificate when exists',
    Effect.fn(function* () {
      const certRepo = yield* CertificateRepository;
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
      yield* certRepo.issue(
        { enrollmentId: enrollment.id, recipientName: 'Test User' },
        userId,
        course.id,
        'Test Course',
        'Test Instructor',
      );

      const found = yield* certRepo.findByEnrollment(enrollment.id);
      expect(found).not.toBeNull();
      expect(found?.enrollmentId).toBe(enrollment.id);
    }, withTransactionRollback),
  );

  it.scoped(
    'findByEnrollment - returns null when no certificate issued',
    Effect.fn(function* () {
      const certRepo = yield* CertificateRepository;
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

      const found = yield* certRepo.findByEnrollment(enrollment.id);
      expect(found).toBeNull();
    }, withTransactionRollback),
  );

  it.scoped(
    'issue - creates a new certificate with verification code',
    Effect.fn(function* () {
      const certRepo = yield* CertificateRepository;
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

      const cert = yield* certRepo.issue(
        { enrollmentId: enrollment.id, recipientName: 'Test User' },
        userId,
        course.id,
        'Test Course',
        'Test Instructor',
      );

      expect(cert.enrollmentId).toBe(enrollment.id);
      expect(cert.userId).toBe(userId);
      expect(cert.courseId).toBe(course.id);
      expect(cert.recipientName).toBe('Test User');
      expect(cert.courseTitle).toBe('Test Course');
      expect(cert.instructorName).toBe('Test Instructor');
      // Verification code should be in format XXX-XXX-XXX-XXX
      expect(cert.verificationCode).toMatch(/^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}$/);
    }, withTransactionRollback),
  );

  it.scoped(
    'delete - removes a certificate',
    Effect.fn(function* () {
      const certRepo = yield* CertificateRepository;
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
      const cert = yield* certRepo.issue(
        { enrollmentId: enrollment.id, recipientName: 'Test User' },
        userId,
        course.id,
        'Test Course',
        'Test Instructor',
      );

      yield* certRepo.delete(cert.id);

      const found = yield* certRepo.findByEnrollment(enrollment.id);
      expect(found).toBeNull();
    }, withTransactionRollback),
  );
});
