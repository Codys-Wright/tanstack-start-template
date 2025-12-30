import * as SqlClient from '@effect/sql/SqlClient';
import * as SqlSchema from '@effect/sql/SqlSchema';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { PgLive } from '@core/database';
import { User } from '../domain/schema';

/**
 * UserRepository - Database access layer for users using Effect SQL.
 * Provides type-safe SQL operations with automatic validation.
 */
export class UserRepository extends Effect.Service<UserRepository>()('UserRepository', {
  dependencies: [PgLive],
  effect: Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    // Find all users with optional filtering
    const findAll = SqlSchema.findAll({
      Request: Schema.Struct({
        limit: Schema.optional(Schema.Number),
        offset: Schema.optional(Schema.Number),
      }),
      Result: User,
      execute: (req) => sql`
				SELECT 
					id,
					name,
					email,
					email_verified as "emailVerified",
					image,
					created_at as "createdAt",
					updated_at as "updatedAt",
					role,
					banned,
					ban_reason as "banReason",
					ban_expires as "banExpires"
				FROM "user"
				ORDER BY created_at DESC
				LIMIT ${req.limit ?? 1000}
				OFFSET ${req.offset ?? 0}
			`,
    });

    // Find a single user by ID
    const findById = SqlSchema.single({
      Request: Schema.Struct({ id: Schema.String }),
      Result: User,
      execute: (req) => sql`
				SELECT 
					id,
					name,
					email,
					email_verified as "emailVerified",
					image,
					created_at as "createdAt",
					updated_at as "updatedAt",
					role,
					banned,
					ban_reason as "banReason",
					ban_expires as "banExpires"
				FROM "user"
				WHERE id = ${req.id}
			`,
    });

    // Find a user by email
    const findByEmail = SqlSchema.single({
      Request: Schema.Struct({ email: Schema.String }),
      Result: User,
      execute: (req) => sql`
				SELECT 
					id,
					name,
					email,
					email_verified as "emailVerified",
					image,
					created_at as "createdAt",
					updated_at as "updatedAt",
					role,
					banned,
					ban_reason as "banReason",
					ban_expires as "banExpires"
				FROM "user"
				WHERE email = ${req.email}
			`,
    });

    // Count total users
    const count = SqlSchema.single({
      Request: Schema.Struct({}),
      Result: Schema.Struct({ count: Schema.Number }),
      execute: () => sql`
				SELECT COUNT(*)::int as count FROM "user"
			`,
    });

    // Count users by role
    const countByRole = SqlSchema.findAll({
      Request: Schema.Struct({}),
      Result: Schema.Struct({
        role: Schema.NullOr(Schema.String),
        count: Schema.Number,
      }),
      execute: () => sql`
				SELECT role, COUNT(*)::int as count 
				FROM "user"
				GROUP BY role
				ORDER BY count DESC
			`,
    });

    return {
      findAll,
      findById,
      findByEmail,
      count,
      countByRole,
    } as const;
  }),
}) {}
