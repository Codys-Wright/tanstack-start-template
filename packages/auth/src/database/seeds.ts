/**
 * Auth Database Seeders
 *
 * Composable seeders for creating fake users and organizations.
 * Uses Effect Schema Arbitrary with @faker-js/faker for realistic data.
 */

import { makeCleanup, makeSeeder, type CleanupEntry, type SeederEntry } from '@core/database';
import * as SqlClient from '@effect/sql/SqlClient';
import * as Arbitrary from 'effect/Arbitrary';
import * as Effect from 'effect/Effect';
import * as FastCheck from 'effect/FastCheck';
import * as Schema from 'effect/Schema';
import { faker } from '@faker-js/faker';
import { hashPassword } from 'better-auth/crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Seed Data Schemas
// ─────────────────────────────────────────────────────────────────────────────

const SeedUser = Schema.Struct({
  name: Schema.String.annotations({
    arbitrary: () => (fc) => fc.constant(null).map(() => faker.person.fullName()),
  }),
  email: Schema.String.annotations({
    arbitrary: () => (fc) => fc.constant(null).map(() => faker.internet.email().toLowerCase()),
  }),
  role: Schema.String.annotations({
    arbitrary: () => (fc) => fc.constant(null).map(() => (Math.random() < 0.1 ? 'admin' : 'user')),
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// Dev Admin Seeder
// ─────────────────────────────────────────────────────────────────────────────

/** Predefined dev admin credentials */
const DEV_ADMIN = {
  email: 'admin@gmail.com',
  password: 'admin1234',
  name: 'Dev Admin',
  role: 'admin',
} as const;

/**
 * Check if we're in a development environment.
 * Only allows dev admin seeding when NODE_ENV is 'dev', 'development', or 'local'.
 */
const isDevEnvironment = (): boolean => {
  const env = process.env.NODE_ENV?.toLowerCase();
  return env === 'dev' || env === 'development' || env === 'local';
};

/**
 * Seeds a predefined admin account for development testing.
 * Only works when NODE_ENV is 'dev', 'development', or 'local'.
 *
 * Credentials:
 * - Email: admin@gmail.com
 * - Password: admin
 *
 * @example
 * ```ts
 * devAdmin()  // seeds the dev admin (if in dev environment)
 * ```
 */
export const devAdmin = makeSeeder({ name: 'devAdmin', defaultCount: 1, dependsOn: [] }, () =>
  Effect.gen(function* () {
    // Only seed in dev environments
    if (!isDevEnvironment()) {
      yield* Effect.logWarning(
        `[devAdmin] Skipping - NODE_ENV="${process.env.NODE_ENV}" is not a dev environment`,
      );
      return { name: 'devAdmin', existing: 0, created: 0 };
    }

    const sql = yield* SqlClient.SqlClient;

    // Check if dev admin already exists
    const existing = yield* sql<{ id: string }>`
      SELECT id FROM "user" WHERE email = ${DEV_ADMIN.email}
    `;

    if (existing.length > 0) {
      return { name: 'devAdmin', existing: 1, created: 0 };
    }

    // Create the dev admin (use Better Auth's hashPassword for compatibility)
    const hashedPassword = yield* Effect.promise(() => hashPassword(DEV_ADMIN.password));

    const result = yield* sql<{ id: string }>`
      INSERT INTO "user" (id, name, email, "emailVerified", role, fake, "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, ${DEV_ADMIN.name}, ${DEV_ADMIN.email}, true, ${DEV_ADMIN.role}, true, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;

    if (result.length > 0) {
      const userId = result[0].id;
      yield* sql`
        INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, ${DEV_ADMIN.email}, 'credential', ${userId}, ${hashedPassword}, NOW(), NOW())
      `;

      yield* Effect.log(`[devAdmin] Created dev admin: ${DEV_ADMIN.email} / ${DEV_ADMIN.password}`);
      return { name: 'devAdmin', existing: 0, created: 1 };
    }

    return { name: 'devAdmin', existing: 0, created: 0 };
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// User Seeder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seeds fake users with realistic data.
 * Default password for all seeded users: "password123"
 *
 * @example
 * ```ts
 * users()      // seed 50 users (default)
 * users(100)   // seed 100 users
 * ```
 */
export const users = makeSeeder(
  { name: 'users', defaultCount: 50, dependsOn: ['devAdmin'] },
  (count) =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      // Check existing fake users
      const existing = yield* sql<{ count: string }>`
        SELECT COUNT(*)::text as count FROM "user" WHERE fake = true
      `;
      const existingCount = Number(existing[0].count);

      if (existingCount >= count) {
        return { name: 'users', existing: existingCount, created: 0 };
      }

      const toCreate = count - existingCount;
      const arb = Arbitrary.make(SeedUser);
      const seedUsers = FastCheck.sample(arb, toCreate);
      // Use Better Auth's hashPassword for compatibility
      const hashedPassword = yield* Effect.promise(() => hashPassword('password123'));

      let admins = 0;
      let regularUsers = 0;

      for (const user of seedUsers) {
        const result = yield* sql<{ id: string }>`
          INSERT INTO "user" (id, name, email, "emailVerified", role, fake, "createdAt", "updatedAt")
          VALUES (gen_random_uuid()::text, ${user.name}, ${user.email}, false, ${user.role}, true, NOW(), NOW())
          ON CONFLICT (email) DO NOTHING
          RETURNING id
        `;

        if (result.length > 0) {
          const userId = result[0].id;
          yield* sql`
            INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
            VALUES (gen_random_uuid()::text, ${user.email}, 'credential', ${userId}, ${hashedPassword}, NOW(), NOW())
          `;
          if (user.role === 'admin') admins++;
          else regularUsers++;
        }
      }

      return {
        name: 'users',
        existing: existingCount,
        created: admins + regularUsers,
        details: { admins, regularUsers },
      };
    }),
);

// ─────────────────────────────────────────────────────────────────────────────
// Organization Seeder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seeds fake organizations with fake users as owners.
 * Depends on users seeder.
 *
 * @example
 * ```ts
 * organizations()      // seed 10 organizations (default)
 * organizations(20)    // seed 20 organizations
 * ```
 */
export const organizations = makeSeeder(
  { name: 'organizations', defaultCount: 10, dependsOn: ['users'] },
  (count) =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      // Get fake users to be org owners
      const fakeUsers = yield* sql<{ id: string }>`
        SELECT id FROM "user" WHERE fake = true ORDER BY RANDOM()
      `;

      if (fakeUsers.length === 0) {
        yield* Effect.logWarning('[organizations] No fake users found, skipping');
        return { name: 'organizations', existing: 0, created: 0 };
      }

      // Check existing orgs with fake flag
      const existing = yield* sql<{ count: string }>`
        SELECT COUNT(*)::text as count FROM organization WHERE fake = true
      `;
      const existingCount = Number(existing[0].count);

      if (existingCount >= count) {
        return { name: 'organizations', existing: existingCount, created: 0 };
      }

      const toCreate = count - existingCount;
      let created = 0;

      for (let i = 0; i < toCreate; i++) {
        const owner = fakeUsers[i % fakeUsers.length];
        const name = faker.company.name();
        const slug = `${faker.helpers.slugify(name).toLowerCase()}-${faker.string.alphanumeric(4)}`;

        const result = yield* sql<{ id: string }>`
          INSERT INTO organization (id, name, slug, fake, "createdAt")
          VALUES (gen_random_uuid()::text, ${name}, ${slug}, true, NOW())
          ON CONFLICT (slug) DO NOTHING
          RETURNING id
        `;

        if (result.length > 0) {
          const orgId = result[0].id;

          // Add owner as a member with 'owner' role
          yield* sql`
            INSERT INTO member (id, "userId", "organizationId", role, "createdAt")
            VALUES (gen_random_uuid()::text, ${owner.id}, ${orgId}, 'owner', NOW())
            ON CONFLICT DO NOTHING
          `;

          created++;
        }
      }

      return { name: 'organizations', existing: existingCount, created };
    }),
);

// ─────────────────────────────────────────────────────────────────────────────
// Auth Seed Composer
// ─────────────────────────────────────────────────────────────────────────────

interface AuthSeedOptions {
  readonly devAdmin?: boolean;
  readonly users?: number;
  readonly organizations?: number;
}

/**
 * Compose auth seeders with optional count overrides.
 *
 * @example
 * ```ts
 * auth()                           // all defaults (devAdmin + 50 users + 10 orgs)
 * auth({ users: 100 })             // 100 users, default orgs
 * auth({ users: 100, organizations: 20 })
 * auth({ devAdmin: false })        // skip dev admin
 * ```
 */
export const auth = (options: AuthSeedOptions = {}): ReadonlyArray<SeederEntry> => {
  const seeders: SeederEntry[] = [];

  // Include devAdmin by default (it will self-skip if not in dev environment)
  if (options.devAdmin !== false) {
    seeders.push(devAdmin());
  }

  seeders.push(users(options.users));
  seeders.push(organizations(options.organizations));

  return seeders;
};

// ─────────────────────────────────────────────────────────────────────────────
// Cleanup
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cleanup fake users and their associated accounts.
 */
export const cleanupUsers = makeCleanup({
  name: 'users',
  countSql: (sql) =>
    sql<{
      count: number;
    }>`SELECT COUNT(*)::int as count FROM "user" WHERE fake = true`.pipe(
      Effect.map((r) => r[0].count),
    ),
  deleteSql: (sql) =>
    Effect.gen(function* () {
      // Delete accounts first (foreign key)
      yield* sql`
        DELETE FROM account WHERE "userId" IN (SELECT id FROM "user" WHERE fake = true)
      `;
      // Delete sessions
      yield* sql`
        DELETE FROM session WHERE "userId" IN (SELECT id FROM "user" WHERE fake = true)
      `;
      // Delete users
      yield* sql`DELETE FROM "user" WHERE fake = true`;
    }),
});

/**
 * Cleanup fake organizations and their members.
 */
export const cleanupOrganizations = makeCleanup({
  name: 'organizations',
  countSql: (sql) =>
    sql<{
      count: number;
    }>`SELECT COUNT(*)::int as count FROM organization WHERE fake = true`.pipe(
      Effect.map((r) => r[0].count),
    ),
  deleteSql: (sql) =>
    Effect.gen(function* () {
      // Delete members first (foreign key)
      yield* sql`
        DELETE FROM member WHERE "organizationId" IN (SELECT id FROM organization WHERE fake = true)
      `;
      // Delete invitations
      yield* sql`
        DELETE FROM invitation WHERE "organizationId" IN (SELECT id FROM organization WHERE fake = true)
      `;
      // Delete organizations
      yield* sql`DELETE FROM organization WHERE fake = true`;
    }),
});

/**
 * Get all auth cleanup operations.
 * Run in reverse dependency order (orgs before users).
 */
export const authCleanup = (): ReadonlyArray<CleanupEntry> => [
  cleanupOrganizations(),
  cleanupUsers(),
];
