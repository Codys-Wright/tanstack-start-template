import * as SqlClient from '@effect/sql/SqlClient';
import * as SqlSchema from '@effect/sql/SqlSchema';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { PgLive } from '@core/database';
import { OrganizationRole } from '../domain/schema.js';

/**
 * MemberRepository - Database access layer for organization members using Effect SQL.
 * Provides type-safe SQL operations with automatic validation.
 */
export class MemberRepository extends Effect.Service<MemberRepository>()('MemberRepository', {
  dependencies: [PgLive],
  effect: Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    // Find all members with user and organization details
    const findAllWithDetails = SqlSchema.findAll({
      Request: Schema.Struct({
        limit: Schema.optional(Schema.Number),
        offset: Schema.optional(Schema.Number),
      }),
      Result: Schema.Struct({
        id: Schema.String,
        organizationId: Schema.String,
        userId: Schema.String,
        role: OrganizationRole,
        createdAt: Schema.DateTimeUtc,
        userName: Schema.String,
        userEmail: Schema.String,
        userImage: Schema.NullOr(Schema.String),
        organizationName: Schema.String,
        organizationSlug: Schema.String,
      }),
      execute: (req) => sql`
        SELECT 
          m.id,
          m.organization_id as "organizationId",
          m.user_id as "userId",
          m.role,
          m.created_at as "createdAt",
          u.name as "userName",
          u.email as "userEmail",
          u.image as "userImage",
          o.name as "organizationName",
          o.slug as "organizationSlug"
        FROM member m
        INNER JOIN "user" u ON u.id = m.user_id
        INNER JOIN organization o ON o.id = m.organization_id
        ORDER BY m.created_at DESC
        LIMIT ${req.limit ?? 1000}
        OFFSET ${req.offset ?? 0}
      `,
    });

    // Count members by role
    const countByRole = SqlSchema.findAll({
      Request: Schema.Struct({}),
      Result: Schema.Struct({
        role: OrganizationRole,
        count: Schema.Number,
      }),
      execute: () => sql`
        SELECT 
          role,
          COUNT(*)::int as count
        FROM member
        GROUP BY role
        ORDER BY count DESC
      `,
    });

    // Count members by organization
    const countByOrganization = SqlSchema.findAll({
      Request: Schema.Struct({}),
      Result: Schema.Struct({
        organizationId: Schema.String,
        organizationName: Schema.String,
        count: Schema.Number,
      }),
      execute: () => sql`
        SELECT 
          o.id as "organizationId",
          o.name as "organizationName",
          COUNT(m.id)::int as count
        FROM organization o
        LEFT JOIN member m ON m.organization_id = o.id
        GROUP BY o.id, o.name
        ORDER BY count DESC
      `,
    });

    // Count total members
    const count = SqlSchema.single({
      Request: Schema.Struct({}),
      Result: Schema.Struct({ count: Schema.Number }),
      execute: () => sql`
        SELECT COUNT(*)::int as count FROM member
      `,
    });

    return {
      findAllWithDetails,
      countByRole,
      countByOrganization,
      count,
    } as const;
  }),
}) {}
