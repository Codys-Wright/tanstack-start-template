import { expect, it } from '@effect/vitest';
import * as BunContext from '@effect/platform-bun/BunContext';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as SqlClient from '@effect/sql/SqlClient';
import { makePgTestMigrations, withTransactionRollback } from '@core/database';
import { AuthMigrations } from '@auth/database';
import { CourseMigrations } from '../../../database/migrations.js';
import { InstructorRepository } from './repo.js';
import type { InstructorId } from '../domain/schema.js';
import { InstructorNotFoundError } from '../domain/schema.js';
import type { UserId } from '@auth';

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

const TestLayer = InstructorRepository.DefaultWithoutDependencies.pipe(
  Layer.provideMerge(PgTest),
  Layer.provide(BunContext.layer),
);

// Helper to insert a test user
const insertTestUser = (id: string) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`
      INSERT INTO "user" (id, name, email, email_verified)
      VALUES (${id}, ${'Test User'}, ${`${id}@test.com`}, false)
    `;
    return id as UserId;
  });

// Helper to insert a test instructor
const insertTestInstructor = (data: {
  id?: string;
  userId: string;
  displayName: string;
  bio?: string;
  headline?: string;
  status?: 'pending' | 'approved' | 'suspended';
}) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const id = data.id ?? crypto.randomUUID();
    yield* sql`
      INSERT INTO instructor_profiles (id, user_id, display_name, bio, headline, status, created_at, updated_at)
      VALUES (
        ${id},
        ${data.userId},
        ${data.displayName},
        ${data.bio ?? null},
        ${data.headline ?? null},
        ${data.status ?? 'pending'},
        NOW(),
        NOW()
      )
    `;
    return id as InstructorId;
  });

it.layer(TestLayer, { timeout: 30_000 })('InstructorRepository', (it) => {
  it.scoped(
    'findAll - returns empty array when no instructors exist',
    Effect.fn(function* () {
      const repo = yield* InstructorRepository;
      const instructors = yield* repo.findAll();
      expect(instructors.length).toBe(0);
    }, withTransactionRollback),
  );

  it.scoped(
    'findAll - returns all instructors',
    Effect.fn(function* () {
      const repo = yield* InstructorRepository;

      const userId1 = yield* insertTestUser('user-1');
      const userId2 = yield* insertTestUser('user-2');

      yield* insertTestInstructor({
        userId: userId1,
        displayName: 'Instructor 1',
      });
      yield* insertTestInstructor({
        userId: userId2,
        displayName: 'Instructor 2',
      });

      const instructors = yield* repo.findAll();
      expect(instructors.length).toBe(2);
    }, withTransactionRollback),
  );

  it.scoped(
    'findApproved - returns only approved instructors',
    Effect.fn(function* () {
      const repo = yield* InstructorRepository;

      const userId1 = yield* insertTestUser('user-1');
      const userId2 = yield* insertTestUser('user-2');
      const userId3 = yield* insertTestUser('user-3');

      yield* insertTestInstructor({
        userId: userId1,
        displayName: 'Approved',
        status: 'approved',
      });
      yield* insertTestInstructor({
        userId: userId2,
        displayName: 'Pending',
        status: 'pending',
      });
      yield* insertTestInstructor({
        userId: userId3,
        displayName: 'Suspended',
        status: 'suspended',
      });

      const approved = yield* repo.findApproved();
      expect(approved.length).toBe(1);
      expect(approved[0].displayName).toBe('Approved');
    }, withTransactionRollback),
  );

  it.scoped(
    'findPending - returns only pending instructors',
    Effect.fn(function* () {
      const repo = yield* InstructorRepository;

      const userId1 = yield* insertTestUser('user-1');
      const userId2 = yield* insertTestUser('user-2');

      yield* insertTestInstructor({
        userId: userId1,
        displayName: 'Approved',
        status: 'approved',
      });
      yield* insertTestInstructor({
        userId: userId2,
        displayName: 'Pending',
        status: 'pending',
      });

      const pending = yield* repo.findPending();
      expect(pending.length).toBe(1);
      expect(pending[0].displayName).toBe('Pending');
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - returns instructor when exists',
    Effect.fn(function* () {
      const repo = yield* InstructorRepository;

      const userId = yield* insertTestUser('user-1');
      const id = yield* insertTestInstructor({
        userId,
        displayName: 'Find Me',
        bio: 'Test bio',
        headline: 'Expert',
      });

      const instructor = yield* repo.findById(id);
      expect(instructor.id).toBe(id);
      expect(instructor.displayName).toBe('Find Me');
      expect(instructor.bio).toBe('Test bio');
      expect(instructor.headline).toBe('Expert');
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - fails with InstructorNotFoundError when not exists',
    Effect.fn(function* () {
      const repo = yield* InstructorRepository;
      const fakeId = crypto.randomUUID() as InstructorId;

      const result = yield* repo.findById(fakeId).pipe(Effect.either);

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(InstructorNotFoundError);
      }
    }, withTransactionRollback),
  );

  it.scoped(
    'findByUserId - returns instructor when exists',
    Effect.fn(function* () {
      const repo = yield* InstructorRepository;

      const userId = yield* insertTestUser('user-1');
      yield* insertTestInstructor({ userId, displayName: 'User Instructor' });

      const instructor = yield* repo.findByUserId(userId);
      expect(instructor).not.toBeNull();
      expect(instructor?.displayName).toBe('User Instructor');
    }, withTransactionRollback),
  );

  it.scoped(
    'findByUserId - returns null when not exists',
    Effect.fn(function* () {
      const repo = yield* InstructorRepository;
      const userId = yield* insertTestUser('user-1');

      const instructor = yield* repo.findByUserId(userId);
      expect(instructor).toBeNull();
    }, withTransactionRollback),
  );

  it.scoped(
    'create - inserts a new instructor',
    Effect.fn(function* () {
      const repo = yield* InstructorRepository;
      // Use a UUID format for user ID since the schema expects UUID
      const userId = yield* insertTestUser(crypto.randomUUID());

      const instructor = yield* repo.create({
        userId: userId as UserId,
        displayName: 'New Instructor',
        bio: 'My bio',
        headline: 'Teacher',
      });

      expect(instructor.displayName).toBe('New Instructor');
      expect(instructor.bio).toBe('My bio');
      expect(instructor.headline).toBe('Teacher');
      expect(instructor.status).toBe('pending');
      expect(instructor.id).toBeDefined();
    }, withTransactionRollback),
  );

  it.scoped(
    'update - updates instructor fields',
    Effect.fn(function* () {
      const repo = yield* InstructorRepository;
      const userId = yield* insertTestUser('user-1');
      const id = yield* insertTestInstructor({
        userId,
        displayName: 'Original',
      });

      const updated = yield* repo.update(id, {
        displayName: 'Updated Name',
        bio: 'Updated bio',
      });

      expect(updated.id).toBe(id);
      expect(updated.displayName).toBe('Updated Name');
      expect(updated.bio).toBe('Updated bio');
    }, withTransactionRollback),
  );

  it.scoped(
    'approve - sets status to approved',
    Effect.fn(function* () {
      const repo = yield* InstructorRepository;
      const userId = yield* insertTestUser('user-1');
      const id = yield* insertTestInstructor({
        userId,
        displayName: 'Pending',
        status: 'pending',
      });

      const approved = yield* repo.approve(id);

      expect(approved.status).toBe('approved');
      expect(approved.approvedAt).not.toBeNull();
    }, withTransactionRollback),
  );

  it.scoped(
    'suspend - sets status to suspended',
    Effect.fn(function* () {
      const repo = yield* InstructorRepository;
      const userId = yield* insertTestUser('user-1');
      const id = yield* insertTestInstructor({
        userId,
        displayName: 'Active',
        status: 'approved',
      });

      const suspended = yield* repo.suspend(id);

      expect(suspended.status).toBe('suspended');
    }, withTransactionRollback),
  );

  it.scoped(
    'delete - removes an instructor',
    Effect.fn(function* () {
      const repo = yield* InstructorRepository;
      const userId = yield* insertTestUser('user-1');
      const id = yield* insertTestInstructor({
        userId,
        displayName: 'To Delete',
      });

      const before = yield* repo.findAll();
      expect(before.length).toBe(1);

      yield* repo.delete(id);

      const after = yield* repo.findAll();
      expect(after.length).toBe(0);
    }, withTransactionRollback),
  );
});
