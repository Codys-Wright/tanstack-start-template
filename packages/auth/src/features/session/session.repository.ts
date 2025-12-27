import * as SqlClient from "@effect/sql/SqlClient";
import * as SqlSchema from "@effect/sql/SqlSchema";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { PgLive } from "@core/database";

/**
 * SessionRepository - Database access layer for sessions using Effect SQL.
 * Provides type-safe SQL operations with automatic validation.
 */
export class SessionRepository extends Effect.Service<SessionRepository>()(
  "SessionRepository",
  {
    dependencies: [PgLive],
    effect: Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      // Find all sessions with user details
      const findAllWithUser = SqlSchema.findAll({
        Request: Schema.Struct({
          limit: Schema.optional(Schema.Number),
          offset: Schema.optional(Schema.Number),
        }),
        Result: Schema.Struct({
          id: Schema.String,
          expiresAt: Schema.DateTimeUtc,
          token: Schema.String,
          createdAt: Schema.DateTimeUtc,
          updatedAt: Schema.DateTimeUtc,
          ipAddress: Schema.optional(Schema.String),
          userAgent: Schema.optional(Schema.String),
          userId: Schema.String,
          activeOrganizationId: Schema.optional(Schema.NullOr(Schema.String)),
          activeTeamId: Schema.optional(Schema.NullOr(Schema.String)),
          impersonatedBy: Schema.optional(Schema.NullOr(Schema.String)),
          userName: Schema.String,
          userEmail: Schema.String,
        }),
        execute: (req) => sql`
					SELECT 
						s.id,
						s.expires_at as "expiresAt",
						s.token,
						s.created_at as "createdAt",
						s.updated_at as "updatedAt",
						s.ip_address as "ipAddress",
						s.user_agent as "userAgent",
						s.user_id as "userId",
						s.active_organization_id as "activeOrganizationId",
						s.active_team_id as "activeTeamId",
						s.impersonated_by as "impersonatedBy",
						u.name as "userName",
						u.email as "userEmail"
					FROM session s
					INNER JOIN "user" u ON u.id = s.user_id
					ORDER BY s.created_at DESC
					LIMIT ${req.limit ?? 1000}
					OFFSET ${req.offset ?? 0}
				`,
      });

      // Find active sessions (not expired)
      const findActive = SqlSchema.findAll({
        Request: Schema.Struct({
          limit: Schema.optional(Schema.Number),
          offset: Schema.optional(Schema.Number),
        }),
        Result: Schema.Struct({
          id: Schema.String,
          expiresAt: Schema.DateTimeUtc,
          token: Schema.String,
          createdAt: Schema.DateTimeUtc,
          updatedAt: Schema.DateTimeUtc,
          ipAddress: Schema.optional(Schema.String),
          userAgent: Schema.optional(Schema.String),
          userId: Schema.String,
          activeOrganizationId: Schema.optional(Schema.NullOr(Schema.String)),
          activeTeamId: Schema.optional(Schema.NullOr(Schema.String)),
          impersonatedBy: Schema.optional(Schema.NullOr(Schema.String)),
          userName: Schema.String,
          userEmail: Schema.String,
        }),
        execute: (req) => sql`
					SELECT 
						s.id,
						s.expires_at as "expiresAt",
						s.token,
						s.created_at as "createdAt",
						s.updated_at as "updatedAt",
						s.ip_address as "ipAddress",
						s.user_agent as "userAgent",
						s.user_id as "userId",
						s.active_organization_id as "activeOrganizationId",
						s.active_team_id as "activeTeamId",
						s.impersonated_by as "impersonatedBy",
						u.name as "userName",
						u.email as "userEmail"
					FROM session s
					INNER JOIN "user" u ON u.id = s.user_id
					WHERE s.expires_at > NOW()
					ORDER BY s.created_at DESC
					LIMIT ${req.limit ?? 1000}
					OFFSET ${req.offset ?? 0}
				`,
      });

      // Count total sessions
      const count = SqlSchema.single({
        Request: Schema.Struct({}),
        Result: Schema.Struct({ count: Schema.Number }),
        execute: () => sql`
					SELECT COUNT(*)::int as count FROM session
				`,
      });

      // Count active sessions
      const countActive = SqlSchema.single({
        Request: Schema.Struct({}),
        Result: Schema.Struct({ count: Schema.Number }),
        execute: () => sql`
					SELECT COUNT(*)::int as count 
					FROM session 
					WHERE expires_at > NOW()
				`,
      });

      return {
        findAllWithUser,
        findActive,
        count,
        countActive,
      } as const;
    }),
  },
) {}
