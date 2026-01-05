import { expect, it } from '@effect/vitest';
import * as BunContext from '@effect/platform-bun/BunContext';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as SqlClient from '@effect/sql/SqlClient';
import { makePgTestMigrations, withTransactionRollback } from '@core/database';
import { AuthMigrations } from '@auth/database';
import { CourseMigrations } from '../../../database/migrations.js';
import { SectionRepository } from './repo.js';
import type { SectionId } from '../domain/schema.js';
import { SectionNotFoundError } from '../domain/schema.js';
import type { CourseId } from '../../course/domain/schema.js';

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

const TestLayer = SectionRepository.DefaultWithoutDependencies.pipe(
  Layer.provideMerge(PgTest),
  Layer.provide(BunContext.layer),
);

// Helpers
const insertTestUser = (id: string) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`INSERT INTO "user" (id, name, email, email_verified) VALUES (${id}, 'Test', ${`${id}@test.com`}, false)`;
    return id;
  });

const insertTestInstructor = (userId: string) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const id = crypto.randomUUID();
    yield* sql`INSERT INTO instructor_profiles (id, user_id, display_name, status) VALUES (${id}, ${userId}, 'Test', 'approved')`;
    return id;
  });

const insertTestCourse = (instructorId: string) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const id = crypto.randomUUID();
    yield* sql`INSERT INTO courses (id, instructor_id, title, slug, pricing, status) VALUES (${id}, ${instructorId}, 'Test', ${`course-${id}`}, '{"model":"free"}'::jsonb, 'draft')`;
    return id as CourseId;
  });

const insertTestSection = (data: { courseId: string; title: string; sortOrder?: number }) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const id = crypto.randomUUID();
    yield* sql`
      INSERT INTO course_sections (id, course_id, title, sort_order, created_at, updated_at)
      VALUES (${id}, ${data.courseId}, ${data.title}, ${data.sortOrder ?? 0}, NOW(), NOW())
    `;
    return id as SectionId;
  });

it.layer(TestLayer, { timeout: 30_000 })('SectionRepository', (it) => {
  it.scoped(
    'findByCourse - returns empty array when no sections exist',
    Effect.fn(function* () {
      const repo = yield* SectionRepository;
      const userId = yield* insertTestUser('user-1');
      const instructorId = yield* insertTestInstructor(userId);
      const courseId = yield* insertTestCourse(instructorId);

      const sections = yield* repo.findByCourse(courseId);
      expect(sections.length).toBe(0);
    }, withTransactionRollback),
  );

  it.scoped(
    'findByCourse - returns sections ordered by sort_order',
    Effect.fn(function* () {
      const repo = yield* SectionRepository;
      const userId = yield* insertTestUser('user-1');
      const instructorId = yield* insertTestInstructor(userId);
      const courseId = yield* insertTestCourse(instructorId);

      yield* insertTestSection({ courseId, title: 'Section 3', sortOrder: 2 });
      yield* insertTestSection({ courseId, title: 'Section 1', sortOrder: 0 });
      yield* insertTestSection({ courseId, title: 'Section 2', sortOrder: 1 });

      const sections = yield* repo.findByCourse(courseId);
      expect(sections.length).toBe(3);
      expect(sections[0].title).toBe('Section 1');
      expect(sections[1].title).toBe('Section 2');
      expect(sections[2].title).toBe('Section 3');
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - returns section when exists',
    Effect.fn(function* () {
      const repo = yield* SectionRepository;
      const userId = yield* insertTestUser('user-1');
      const instructorId = yield* insertTestInstructor(userId);
      const courseId = yield* insertTestCourse(instructorId);
      const id = yield* insertTestSection({ courseId, title: 'Find Me' });

      const section = yield* repo.findById(id);
      expect(section.id).toBe(id);
      expect(section.title).toBe('Find Me');
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - fails with SectionNotFoundError when not exists',
    Effect.fn(function* () {
      const repo = yield* SectionRepository;
      const fakeId = crypto.randomUUID() as SectionId;

      const result = yield* repo.findById(fakeId).pipe(Effect.either);

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(SectionNotFoundError);
      }
    }, withTransactionRollback),
  );

  it.scoped(
    'create - inserts a new section with auto sort_order',
    Effect.fn(function* () {
      const repo = yield* SectionRepository;
      const userId = yield* insertTestUser('user-1');
      const instructorId = yield* insertTestInstructor(userId);
      const courseId = yield* insertTestCourse(instructorId);

      // Create first section
      const section1 = yield* repo.create({ courseId, title: 'Section 1' });
      expect(section1.sortOrder).toBe(1);

      // Create second section - should auto-increment
      const section2 = yield* repo.create({ courseId, title: 'Section 2' });
      expect(section2.sortOrder).toBe(2);
    }, withTransactionRollback),
  );

  it.scoped(
    'update - updates section fields',
    Effect.fn(function* () {
      const repo = yield* SectionRepository;
      const userId = yield* insertTestUser('user-1');
      const instructorId = yield* insertTestInstructor(userId);
      const courseId = yield* insertTestCourse(instructorId);
      const id = yield* insertTestSection({ courseId, title: 'Original' });

      const updated = yield* repo.update(id, {
        title: 'Updated Title',
        description: 'New description',
      });

      expect(updated.id).toBe(id);
      expect(updated.title).toBe('Updated Title');
      expect(updated.description).toBe('New description');
    }, withTransactionRollback),
  );

  it.scoped(
    'reorder - reorders sections',
    Effect.fn(function* () {
      const repo = yield* SectionRepository;
      const userId = yield* insertTestUser('user-1');
      const instructorId = yield* insertTestInstructor(userId);
      const courseId = yield* insertTestCourse(instructorId);

      const id1 = yield* insertTestSection({
        courseId,
        title: 'Section 1',
        sortOrder: 0,
      });
      const id2 = yield* insertTestSection({
        courseId,
        title: 'Section 2',
        sortOrder: 1,
      });
      const id3 = yield* insertTestSection({
        courseId,
        title: 'Section 3',
        sortOrder: 2,
      });

      // Reorder: 3, 1, 2
      yield* repo.reorder([id3, id1, id2]);

      const sections = yield* repo.findByCourse(courseId);
      expect(sections[0].id).toBe(id3);
      expect(sections[1].id).toBe(id1);
      expect(sections[2].id).toBe(id2);
    }, withTransactionRollback),
  );

  it.scoped(
    'delete - removes a section',
    Effect.fn(function* () {
      const repo = yield* SectionRepository;
      const userId = yield* insertTestUser('user-1');
      const instructorId = yield* insertTestInstructor(userId);
      const courseId = yield* insertTestCourse(instructorId);
      const id = yield* insertTestSection({ courseId, title: 'To Delete' });

      const before = yield* repo.findByCourse(courseId);
      expect(before.length).toBe(1);

      yield* repo.delete(id);

      const after = yield* repo.findByCourse(courseId);
      expect(after.length).toBe(0);
    }, withTransactionRollback),
  );
});
