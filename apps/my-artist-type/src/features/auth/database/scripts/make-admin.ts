/**
 * Make Admin Script
 *
 * Promotes a user to admin role by email address.
 * Run with: bun run admin:set <email>
 *
 * Example: bun run admin:set user@example.com
 */

import pg from "pg";

const { Pool } = pg;

async function makeAdmin(email: string) {
	console.log(`\n🔧 Promoting user to admin...`);
	console.log(`   Email: ${email}\n`);

	// Create database connection
	const pool = new Pool({
		connectionString: process.env.DATABASE_URL,
	});

	try {
		// Find the user
		const result = await pool.query(
			`SELECT id, email, name, role FROM "user" WHERE email = $1`,
			[email],
		);

		if (result.rows.length === 0) {
			console.error(`❌ Error: User not found with email: ${email}`);
			await pool.end();
			process.exit(1);
		}

		const user = result.rows[0];

		console.log(`✅ Found user: ${user.name || "Unnamed"} (${user.email})`);
		console.log(`   Current role: ${user.role || "user"}`);

		// Check if already admin
		const currentRoles = Array.isArray(user.role)
			? user.role
			: user.role
				? [user.role]
				: [];

		if (currentRoles.includes("admin")) {
			console.log(`\n✨ User is already an admin!`);
			await pool.end();
			process.exit(0);
		}

		// Update to admin role
		await pool.query(`UPDATE "user" SET role = $1 WHERE id = $2`, ["admin", user.id]);

		console.log(`\n✨ Success! User is now an admin.`);
		console.log(`   Updated role: admin\n`);

		await pool.end();
		process.exit(0);
	} catch (error) {
		console.error(`\n❌ Error:`, error);
		await pool.end();
		process.exit(1);
	}
}

// Main execution
const email = process.argv[2];

if (!email) {
	console.error(`\n❌ Error: Email address required`);
	console.log(`\nUsage: bun run admin:set <email>`);
	console.log(`Example: bun run admin:set user@example.com\n`);
	process.exit(1);
}

makeAdmin(email);
