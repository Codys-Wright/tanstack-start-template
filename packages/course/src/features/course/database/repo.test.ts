import { expect, it } from '@effect/vitest';
import * as BunContext from '@effect/platform-bun/BunContext';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as SqlClient from '@effect/sql/SqlClient';
import { makePgTestMigrations, withTransactionRollback } from '@core/database';
import { AuthMigrations } from '@auth/database';
import { CourseMigrations } from '../../../database/migrations.js';
import { CourseRepository } from './repo.js';
import type { CourseId } from '../domain/schema.js';
import { CourseNotFoundError } from '../domain/schema.js';
import type { InstructorId } from '../../instructor/domain/schema.js';
import type { CategoryId } from '../../category/domain/schema.js';

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

const TestLayer = CourseRepository.DefaultWithoutDependencies.pipe(
  Layer.provideMerge(PgTest),
  Layer.provide(BunContext.layer),
);

// Helper to insert test data
const insertTestUser = (id: string) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`
      INSERT INTO "user" (id, name, email, email_verified)
      VALUES (${id}, ${'Test User'}, ${`${id}@test.com`}, false)
    `;
    return id;
  });

const insertTestInstructor = (userId: string) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const id = crypto.randomUUID();
    yield* sql`
      INSERT INTO instructor_profiles (id, user_id, display_name, status, created_at, updated_at)
      VALUES (${id}, ${userId}, 'Test Instructor', 'approved', NOW(), NOW())
    `;
    return id as InstructorId;
  });

const insertTestCategory = () =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const id = crypto.randomUUID();
    yield* sql`
      INSERT INTO course_categories (id, name, slug, is_active, created_at, updated_at)
      VALUES (${id}, 'Test Category', ${`cat-${id}`}, true, NOW(), NOW())
    `;
    return id as CategoryId;
  });

const insertTestCourse = (data: {
  instructorId: string;
  title: string;
  slug?: string;
  categoryId?: string;
  status?: 'draft' | 'published' | 'archived';
}) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const id = crypto.randomUUID();
    const slug = data.slug ?? `course-${id}`;
    yield* sql`
      INSERT INTO courses (id, instructor_id, title, slug, category_id, status, pricing, created_at, updated_at)
      VALUES (
        ${id},
        ${data.instructorId},
        ${data.title},
        ${slug},
        ${data.categoryId ?? null},
        ${data.status ?? 'draft'},
        '{"model": "free"}'::jsonb,
        NOW(),
        NOW()
      )
    `;
    return id as CourseId;
  });

it.layer(TestLayer, { timeout: 30_000 })('CourseRepository', (it) => {
  it.scoped(
    'findAll - returns empty array when no courses exist',
    Effect.fn(function* () {
      const repo = yield* CourseRepository;
      const courses = yield* repo.findAll();
      expect(courses.length).toBe(0);
    }, withTransactionRollback),
  );

  it.scoped(
    'findAll - returns all non-deleted courses',
    Effect.fn(function* () {
      const repo = yield* CourseRepository;

      const userId = yield* insertTestUser('user-1');
      const instructorId = yield* insertTestInstructor(userId);

      yield* insertTestCourse({ instructorId, title: 'Course 1' });
      yield* insertTestCourse({ instructorId, title: 'Course 2' });

      const courses = yield* repo.findAll();
      expect(courses.length).toBe(2);
    }, withTransactionRollback),
  );

  it.scoped(
    'findPublished - returns only published courses',
    Effect.fn(function* () {
      const repo = yield* CourseRepository;

      const userId = yield* insertTestUser('user-1');
      const instructorId = yield* insertTestInstructor(userId);

      yield* insertTestCourse({
        instructorId,
        title: 'Published',
        status: 'published',
      });
      yield* insertTestCourse({
        instructorId,
        title: 'Draft',
        status: 'draft',
      });

      const published = yield* repo.findPublished();
      expect(published.length).toBe(1);
      expect(published[0].title).toBe('Published');
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - returns course when exists',
    Effect.fn(function* () {
      const repo = yield* CourseRepository;

      const userId = yield* insertTestUser('user-1');
      const instructorId = yield* insertTestInstructor(userId);
      const id = yield* insertTestCourse({ instructorId, title: 'Find Me' });

      const course = yield* repo.findById(id);
      expect(course.id).toBe(id);
      expect(course.title).toBe('Find Me');
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - fails with CourseNotFoundError when not exists',
    Effect.fn(function* () {
      const repo = yield* CourseRepository;
      const fakeId = crypto.randomUUID() as CourseId;

      const result = yield* repo.findById(fakeId).pipe(Effect.either);

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(CourseNotFoundError);
      }
    }, withTransactionRollback),
  );

  it.scoped(
    'findBySlug - returns course when exists',
    Effect.fn(function* () {
      const repo = yield* CourseRepository;

      const userId = yield* insertTestUser('user-1');
      const instructorId = yield* insertTestInstructor(userId);
      yield* insertTestCourse({
        instructorId,
        title: 'Slug Test',
        slug: 'slug-test',
      });

      const course = yield* repo.findBySlug('slug-test');
      expect(course.title).toBe('Slug Test');
    }, withTransactionRollback),
  );

  it.scoped(
    'findByInstructor - returns courses by instructor',
    Effect.fn(function* () {
      const repo = yield* CourseRepository;

      const userId1 = yield* insertTestUser('user-1');
      const userId2 = yield* insertTestUser('user-2');
      const instructorId1 = yield* insertTestInstructor(userId1);
      const instructorId2 = yield* insertTestInstructor(userId2);

      yield* insertTestCourse({
        instructorId: instructorId1,
        title: 'Course 1',
      });
      yield* insertTestCourse({
        instructorId: instructorId1,
        title: 'Course 2',
      });
      yield* insertTestCourse({
        instructorId: instructorId2,
        title: 'Course 3',
      });

      const courses = yield* repo.findByInstructor(instructorId1);
      expect(courses.length).toBe(2);
    }, withTransactionRollback),
  );

  it.scoped(
    'findByCategory - returns published courses in category',
    Effect.fn(function* () {
      const repo = yield* CourseRepository;

      const userId = yield* insertTestUser('user-1');
      const instructorId = yield* insertTestInstructor(userId);
      const categoryId = yield* insertTestCategory();

      yield* insertTestCourse({
        instructorId,
        title: 'In Category',
        categoryId,
        status: 'published',
      });
      yield* insertTestCourse({
        instructorId,
        title: 'Draft In Category',
        categoryId,
        status: 'draft',
      });
      yield* insertTestCourse({
        instructorId,
        title: 'No Category',
        status: 'published',
      });

      const courses = yield* repo.findByCategory(categoryId);
      expect(courses.length).toBe(1);
      expect(courses[0].title).toBe('In Category');
    }, withTransactionRollback),
  );

  it.scoped(
    'create - inserts a new course',
    Effect.fn(function* () {
      const repo = yield* CourseRepository;

      const userId = yield* insertTestUser('user-1');
      const instructorId = yield* insertTestInstructor(userId);

      const course = yield* repo.create({
        instructorId,
        title: 'New Course',
        description: 'A new course',
        level: 'beginner',
        pricing: { model: 'free' },
      });

      expect(course.title).toBe('New Course');
      expect(course.description).toBe('A new course');
      expect(course.level).toBe('beginner');
      expect(course.status).toBe('draft');
    }, withTransactionRollback),
  );

  it.scoped(
    'update - updates course fields',
    Effect.fn(function* () {
      const repo = yield* CourseRepository;

      const userId = yield* insertTestUser('user-1');
      const instructorId = yield* insertTestInstructor(userId);
      const id = yield* insertTestCourse({ instructorId, title: 'Original' });

      const updated = yield* repo.update(id, {
        title: 'Updated Title',
        description: 'Updated description',
      });

      expect(updated.id).toBe(id);
      expect(updated.title).toBe('Updated Title');
      expect(updated.description).toBe('Updated description');
    }, withTransactionRollback),
  );

  it.scoped(
    'publish - sets status to published',
    Effect.fn(function* () {
      const repo = yield* CourseRepository;

      const userId = yield* insertTestUser('user-1');
      const instructorId = yield* insertTestInstructor(userId);
      const id = yield* insertTestCourse({
        instructorId,
        title: 'To Publish',
        status: 'draft',
      });

      const published = yield* repo.publish(id);

      expect(published.status).toBe('published');
      expect(published.publishedAt).not.toBeNull();
    }, withTransactionRollback),
  );

  it.scoped(
    'archive - sets status to archived',
    Effect.fn(function* () {
      const repo = yield* CourseRepository;

      const userId = yield* insertTestUser('user-1');
      const instructorId = yield* insertTestInstructor(userId);
      const id = yield* insertTestCourse({
        instructorId,
        title: 'To Archive',
        status: 'published',
      });

      const archived = yield* repo.archive(id);

      expect(archived.status).toBe('archived');
    }, withTransactionRollback),
  );

  it.scoped(
    'delete - soft deletes a course',
    Effect.fn(function* () {
      const repo = yield* CourseRepository;

      const userId = yield* insertTestUser('user-1');
      const instructorId = yield* insertTestInstructor(userId);
      const id = yield* insertTestCourse({ instructorId, title: 'To Delete' });

      const before = yield* repo.findAll();
      expect(before.length).toBe(1);

      yield* repo.delete(id);

      const after = yield* repo.findAll();
      expect(after.length).toBe(0);
    }, withTransactionRollback),
  );
});
