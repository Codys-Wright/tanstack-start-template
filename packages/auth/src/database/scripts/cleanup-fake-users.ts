/**
 * Cleanup Fake Users Script
 *
 * Removes all fake/seeded users from the database.
 * Run with: bun run db:clean
 */

import pg from "pg";

const { Pool } = pg;

async function cleanupFakeUsers() {
  console.log("\n🧹 Cleaning up fake users...\n");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Begin transaction
    const client = await pool.connect();
    await client.query("BEGIN");

    try {
      // Count fake users before deletion
      const countResult = await client.query(
        `SELECT COUNT(*) as count FROM "user" WHERE fake = true`
      );
      const fakeUserCount = Number.parseInt(countResult.rows[0].count, 10);

      if (fakeUserCount === 0) {
        console.log("✅ No fake users to clean up!\n");
        await client.query("ROLLBACK");
        client.release();
        await pool.end();
        process.exit(0);
      }

      console.log(`📊 Found ${fakeUserCount} fake users to remove\n`);

      // Get list of fake user IDs for logging
      const usersResult = await client.query(
        `SELECT id, name, email FROM "user" WHERE fake = true LIMIT 10`
      );

      console.log("Preview of users to be deleted:");
      for (const user of usersResult.rows) {
        console.log(`   - ${user.name} (${user.email})`);
      }
      if (fakeUserCount > 10) {
        console.log(`   ... and ${fakeUserCount - 10} more`);
      }
      console.log("");

      // Delete associated accounts first (foreign key constraint)
      const accountsResult = await client.query(
        `
				DELETE FROM account 
				WHERE "userId" IN (SELECT id FROM "user" WHERE fake = true)
			`
      );
      const deletedAccounts = accountsResult.rowCount || 0;

      // Delete associated sessions
      const sessionsResult = await client.query(
        `
				DELETE FROM session 
				WHERE "userId" IN (SELECT id FROM "user" WHERE fake = true)
			`
      );
      const deletedSessions = sessionsResult.rowCount || 0;

      // Delete organization memberships
      await client.query(
        `
				DELETE FROM member 
				WHERE "userId" IN (SELECT id FROM "user" WHERE fake = true)
			`
      );

      // Delete team memberships
      await client.query(
        `
				DELETE FROM "teamMember" 
				WHERE "userId" IN (SELECT id FROM "user" WHERE fake = true)
			`
      );

      // Delete invitations sent to fake users
      await client.query(
        `
				DELETE FROM invitation 
				WHERE email IN (SELECT email FROM "user" WHERE fake = true)
			`
      );

      // Finally, delete the fake users
      const usersDeleteResult = await client.query(
        `DELETE FROM "user" WHERE fake = true`
      );
      const deletedUsers = usersDeleteResult.rowCount || 0;

      // Commit transaction
      await client.query("COMMIT");
      client.release();

      console.log("✨ Cleanup complete!\n");
      console.log(`   👤 Users deleted: ${deletedUsers}`);
      console.log(`   🔑 Accounts deleted: ${deletedAccounts}`);
      console.log(`   📱 Sessions deleted: ${deletedSessions}\n`);

      await pool.end();
      process.exit(0);
    } catch (error) {
      // Rollback on error
      await client.query("ROLLBACK");
      client.release();
      throw error;
    }
  } catch (error) {
    console.error("\n❌ Cleanup failed:", error);
    await pool.end();
    process.exit(1);
  }
}

cleanupFakeUsers();
