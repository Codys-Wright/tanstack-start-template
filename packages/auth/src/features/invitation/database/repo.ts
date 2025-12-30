import * as SqlClient from '@effect/sql/SqlClient';
import * as SqlSchema from '@effect/sql/SqlSchema';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { PgLive } from '@core/database';
import { InvitationStatus } from '../domain/schema';

/**
 * InvitationRepository - Database access layer for invitations using Effect SQL.
 * Provides type-safe SQL operations with automatic validation.
 */
export class InvitationRepository extends Effect.Service<InvitationRepository>()(
  'InvitationRepository',
  {
    dependencies: [PgLive],
    effect: Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      // Find all invitations with organization details
      const findAllWithDetails = SqlSchema.findAll({
        Request: Schema.Struct({
          limit: Schema.optional(Schema.Number),
          offset: Schema.optional(Schema.Number),
        }),
        Result: Schema.Struct({
          id: Schema.String,
          organizationId: Schema.String,
          email: Schema.String,
          role: Schema.String,
          status: InvitationStatus,
          expiresAt: Schema.DateTimeUtc,
          createdAt: Schema.DateTimeUtc,
          inviterId: Schema.optional(Schema.String),
          organizationName: Schema.String,
          teamId: Schema.optional(Schema.NullOr(Schema.String)),
          inviterName: Schema.optional(Schema.NullOr(Schema.String)),
        }),
        execute: (req) => sql`
          SELECT 
            i.id,
            i.organization_id as "organizationId",
            i.email,
            i.role,
            i.status,
            i.expires_at as "expiresAt",
            i.created_at as "createdAt",
            i.inviter_id as "inviterId",
            o.name as "organizationName",
            i.team_id as "teamId",
            u.name as "inviterName"
          FROM invitation i
          INNER JOIN organization o ON o.id = i.organization_id
          LEFT JOIN "user" u ON u.id = i.inviter_id
          ORDER BY i.created_at DESC
          LIMIT ${req.limit ?? 1000}
          OFFSET ${req.offset ?? 0}
        `,
      });

      // Find pending invitations
      const findPending = SqlSchema.findAll({
        Request: Schema.Struct({
          limit: Schema.optional(Schema.Number),
          offset: Schema.optional(Schema.Number),
        }),
        Result: Schema.Struct({
          id: Schema.String,
          organizationId: Schema.String,
          email: Schema.String,
          role: Schema.String,
          status: InvitationStatus,
          expiresAt: Schema.DateTimeUtc,
          createdAt: Schema.DateTimeUtc,
          inviterId: Schema.optional(Schema.String),
          organizationName: Schema.String,
          teamId: Schema.optional(Schema.NullOr(Schema.String)),
          inviterName: Schema.optional(Schema.NullOr(Schema.String)),
        }),
        execute: (req) => sql`
          SELECT 
            i.id,
            i.organization_id as "organizationId",
            i.email,
            i.role,
            i.status,
            i.expires_at as "expiresAt",
            i.created_at as "createdAt",
            i.inviter_id as "inviterId",
            o.name as "organizationName",
            i.team_id as "teamId",
            u.name as "inviterName"
          FROM invitation i
          INNER JOIN organization o ON o.id = i.organization_id
          LEFT JOIN "user" u ON u.id = i.inviter_id
          WHERE i.status = 'pending' AND i.expires_at > NOW()
          ORDER BY i.created_at DESC
          LIMIT ${req.limit ?? 1000}
          OFFSET ${req.offset ?? 0}
        `,
      });

      // Count invitations by status
      const countByStatus = SqlSchema.findAll({
        Request: Schema.Struct({}),
        Result: Schema.Struct({
          status: InvitationStatus,
          count: Schema.Number,
        }),
        execute: () => sql`
          SELECT 
            status,
            COUNT(*)::int as count
          FROM invitation
          GROUP BY status
          ORDER BY count DESC
        `,
      });

      // Count total invitations
      const count = SqlSchema.single({
        Request: Schema.Struct({}),
        Result: Schema.Struct({ count: Schema.Number }),
        execute: () => sql`
          SELECT COUNT(*)::int as count FROM invitation
        `,
      });

      return {
        findAllWithDetails,
        findPending,
        countByStatus,
        count,
      } as const;
    }),
  },
) {}
