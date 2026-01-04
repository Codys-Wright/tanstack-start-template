import { expect, it } from '@effect/vitest';
import * as BunContext from '@effect/platform-bun/BunContext';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as SqlClient from '@effect/sql/SqlClient';
import { makePgTestMigrations, withTransactionRollback } from '@core/database';
import { AuthMigrations } from '../../../database/migrations.js';
import { UserRepository } from './repo.js';

// Create test layer with auth migrations applied
const PgTest = makePgTestMigrations(AuthMigrations);

// Repository layer for tests
// BunContext.layer provides Path and CommandExecutor requirements
const TestLayer = UserRepository.DefaultWithoutDependencies.pipe(
  Layer.provideMerge(PgTest),
  Layer.provide(BunContext.layer),
);

// Helper to insert a test user directly via SQL
const insertTestUser = (data: {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  role?: string;
  banned?: boolean;
}) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`
      INSERT INTO "user" (id, name, email, email_verified, role, banned)
      VALUES (
        ${data.id},
        ${data.name},
        ${data.email},
        ${data.emailVerified ?? false},
        ${data.role ?? null},
        ${data.banned ?? false}
      )
    `;
  });

it.layer(TestLayer, { timeout: 30_000 })('UserRepository', (it) => {
  it.scoped(
    'findAll - returns empty array when no users exist',
    Effect.fn(function* () {
      const repo = yield* UserRepository;
      const users = yield* repo.findAll({});
      expect(users.length).toBe(0);
    }, withTransactionRollback),
  );

  it.scoped(
    'findAll - returns users with pagination',
    Effect.fn(function* () {
      const repo = yield* UserRepository;

      // Create test users
      yield* insertTestUser({
        id: 'user-1',
        name: 'User 1',
        email: 'user1@test.com',
      });
      yield* insertTestUser({
        id: 'user-2',
        name: 'User 2',
        email: 'user2@test.com',
      });
      yield* insertTestUser({
        id: 'user-3',
        name: 'User 3',
        email: 'user3@test.com',
      });

      // Get all users
      const allUsers = yield* repo.findAll({});
      expect(allUsers.length).toBe(3);

      // Test limit
      const limited = yield* repo.findAll({ limit: 2 });
      expect(limited.length).toBe(2);

      // Test offset
      const offset = yield* repo.findAll({ limit: 2, offset: 2 });
      expect(offset.length).toBe(1);
    }, withTransactionRollback),
  );

  it.scoped(
    'findById - returns user when exists',
    Effect.fn(function* () {
      const repo = yield* UserRepository;

      yield* insertTestUser({
        id: 'find-by-id-user',
        name: 'Find Me',
        email: 'findme@test.com',
        role: 'admin',
      });

      const user = yield* repo.findById({ id: 'find-by-id-user' });
      expect(user.id).toBe('find-by-id-user');
      expect(user.name).toBe('Find Me');
      expect(user.email).toBe('findme@test.com');
      expect(user.role).toBe('admin');
    }, withTransactionRollback),
  );

  it.scoped(
    'findByEmail - returns user when exists',
    Effect.fn(function* () {
      const repo = yield* UserRepository;

      yield* insertTestUser({
        id: 'email-user',
        name: 'Email User',
        email: 'unique@test.com',
      });

      const user = yield* repo.findByEmail({ email: 'unique@test.com' });
      expect(user.id).toBe('email-user');
      expect(user.name).toBe('Email User');
    }, withTransactionRollback),
  );

  it.scoped(
    'count - returns total user count',
    Effect.fn(function* () {
      const repo = yield* UserRepository;

      // Initially empty
      const initial = yield* repo.count({});
      expect(initial.count).toBe(0);

      // Add users
      yield* insertTestUser({
        id: 'count-1',
        name: 'User 1',
        email: 'count1@test.com',
      });
      yield* insertTestUser({
        id: 'count-2',
        name: 'User 2',
        email: 'count2@test.com',
      });

      const afterInsert = yield* repo.count({});
      expect(afterInsert.count).toBe(2);
    }, withTransactionRollback),
  );

  it.scoped(
    'countByRole - groups users by role',
    Effect.fn(function* () {
      const repo = yield* UserRepository;

      // Add users with different roles
      yield* insertTestUser({
        id: 'admin-1',
        name: 'Admin 1',
        email: 'admin1@test.com',
        role: 'admin',
      });
      yield* insertTestUser({
        id: 'admin-2',
        name: 'Admin 2',
        email: 'admin2@test.com',
        role: 'admin',
      });
      yield* insertTestUser({
        id: 'user-1',
        name: 'User 1',
        email: 'user1@test.com',
        role: 'user',
      });
      yield* insertTestUser({
        id: 'guest-1',
        name: 'Guest 1',
        email: 'guest1@test.com',
      }); // null role

      const roleCounts = yield* repo.countByRole({});

      // Find admin count
      const adminCount = roleCounts.find((r) => r.role === 'admin');
      expect(adminCount?.count).toBe(2);

      // Find user count
      const userCount = roleCounts.find((r) => r.role === 'user');
      expect(userCount?.count).toBe(1);

      // Find null role count
      const nullRoleCount = roleCounts.find((r) => r.role === null);
      expect(nullRoleCount?.count).toBe(1);
    }, withTransactionRollback),
  );
});
