/**
 * Database Seeding Script for Users
 *
 * Creates fake users with realistic data for development and testing.
 * Uses Effect Schema Arbitrary with @faker-js/faker for realistic data generation.
 * Run with: bun run db:seed [count]
 */

import * as Arbitrary from "effect/Arbitrary";
import * as FastCheck from "effect/FastCheck";
import * as Schema from "effect/Schema";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import pg from "pg";

const { Pool } = pg;

/**
 * User Schema for seed data generation
 */
const SeedUser = Schema.Struct({
  name: Schema.NonEmptyString.annotations({
    arbitrary: () => (fc) =>
      fc.constant(null).map(() => faker.person.fullName()),
  }),
  email: Schema.String.annotations({
    arbitrary: () => (fc) =>
      fc.constant(null).map(() => faker.internet.email().toLowerCase()),
  }),
  password: Schema.Literal("password123"), // Default password for all seed users
  role: Schema.String.annotations({
    arbitrary: () => (fc) =>
      // 10% chance of being admin
      fc.constant(null).map(() => (Math.random() < 0.1 ? "admin" : "user")),
  }),
});

type SeedUserData = Schema.Schema.Type<typeof SeedUser>;

/**
 * Generate fake users using Effect Schema Arbitrary
 */
function generateFakeUsers(count: number): SeedUserData[] {
  const arb = Arbitrary.make(SeedUser);
  return FastCheck.sample(arb, count);
}

/**
 * Batch insert users into the database
 */
async function batchInsertUsers(users: SeedUserData[]) {
  console.log(
    `\n🌱 Starting database seeding - Creating ${users.length} users...\n`
  );

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Hash all passwords in parallel
    console.log("🔐 Hashing passwords...");
    const hashedUsers = await Promise.all(
      users.map(async (user) => ({
        ...user,
        hashedPassword: await bcrypt.hash(user.password, 10),
      }))
    );

    console.log("📝 Inserting users into database...\n");

    // Begin transaction
    const client = await pool.connect();
    await client.query("BEGIN");

    try {
      let adminCount = 0;
      let userCount = 0;

      // Batch insert all users
      for (const user of hashedUsers) {
        const isAdmin = user.role === "admin";

        // Insert user with generated UUID and mark as fake, get the ID back
        const userResult = await client.query(
          `
					INSERT INTO "user" (id, name, email, "emailVerified", role, fake, "createdAt", "updatedAt")
					VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW())
					ON CONFLICT (email) DO NOTHING
					RETURNING id
				`,
          [user.name, user.email, false, user.role]
        );

        // Only insert account if user was actually created (not a conflict)
        if (userResult.rows.length > 0) {
          const userId = userResult.rows[0].id;

          // Insert password in account table
          await client.query(
            `
						INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
						VALUES (gen_random_uuid(), $1, 'credential', $2, $3, NOW(), NOW())
						ON CONFLICT DO NOTHING
					`,
            [user.email, userId, user.hashedPassword]
          );

          if (isAdmin) {
            adminCount++;
            console.log(`✅ Created 👑 ADMIN: ${user.name} (${user.email})`);
          } else {
            userCount++;
            console.log(`✅ Created 👤 USER: ${user.name} (${user.email})`);
          }
        }
      }

      // Commit transaction
      await client.query("COMMIT");
      client.release();

      console.log(`\n✨ Seeding complete!`);
      console.log(`   👑 Admins created: ${adminCount}`);
      console.log(`   👤 Users created: ${userCount}`);
      console.log(`   ✅ Total: ${adminCount + userCount} users`);
      console.log(`\n📝 Default password for all users: "password123"\n`);
    } catch (error) {
      // Rollback on error
      await client.query("ROLLBACK");
      client.release();
      throw error;
    }
  } finally {
    await pool.end();
  }
}

/**
 * Main execution
 */
async function main() {
  const count = Number(process.argv[2]) || 50;

  if (count < 1 || count > 1000) {
    console.error("❌ Error: User count must be between 1 and 1000");
    process.exit(1);
  }

  try {
    const users = generateFakeUsers(count);
    await batchInsertUsers(users);
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  }
}

main();
