import * as SqlClient from "@effect/sql/SqlClient";
import * as SqlSchema from "@effect/sql/SqlSchema";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { PgLive } from "@/features/core/database";
import { Organization } from "../domain/organization.schema.js";

/**
 * OrganizationRepository - Database access layer for organizations using Effect SQL.
 * Provides type-safe SQL operations with automatic validation.
 */
export class OrganizationRepository extends Effect.Service<OrganizationRepository>()(
	"OrganizationRepository",
	{
		dependencies: [PgLive],
		effect: Effect.gen(function* () {
			const sql = yield* SqlClient.SqlClient;

			// Find all organizations
			const findAll = SqlSchema.findAll({
				Request: Schema.Struct({
					limit: Schema.optional(Schema.Number),
					offset: Schema.optional(Schema.Number),
				}),
				Result: Organization,
				execute: (req) => sql`
					SELECT 
						id,
						name,
						slug,
						logo,
						metadata,
						created_at as "createdAt"
					FROM organization
					ORDER BY created_at DESC
					LIMIT ${req.limit ?? 1000}
					OFFSET ${req.offset ?? 0}
				`,
			});

			// Find a single organization by ID
			const findById = SqlSchema.single({
				Request: Schema.Struct({ id: Schema.String }),
				Result: Organization,
				execute: (req) => sql`
					SELECT 
						id,
						name,
						slug,
						logo,
						metadata,
						created_at as "createdAt"
					FROM organization
					WHERE id = ${req.id}
				`,
			});

			// Find organization by slug
			const findBySlug = SqlSchema.single({
				Request: Schema.Struct({ slug: Schema.String }),
				Result: Organization,
				execute: (req) => sql`
					SELECT 
						id,
						name,
						slug,
						logo,
						metadata,
						created_at as "createdAt"
					FROM organization
					WHERE slug = ${req.slug}
				`,
			});

			// Count total organizations
			const count = SqlSchema.single({
				Request: Schema.Struct({}),
				Result: Schema.Struct({ count: Schema.Number }),
				execute: () => sql`
					SELECT COUNT(*)::int as count FROM organization
				`,
			});

			// Get organizations with member count
			const findAllWithMemberCount = SqlSchema.findAll({
				Request: Schema.Struct({
					limit: Schema.optional(Schema.Number),
					offset: Schema.optional(Schema.Number),
				}),
				Result: Schema.Struct({
					id: Schema.String,
					name: Schema.String,
					slug: Schema.String,
					logo: Schema.NullOr(Schema.String),
					metadata: Schema.optional(Schema.Unknown),
					createdAt: Schema.DateTimeUtc,
					memberCount: Schema.Number,
				}),
				execute: (req) => sql`
					SELECT 
						o.id,
						o.name,
						o.slug,
						o.logo,
						o.metadata,
						o.created_at as "createdAt",
						COUNT(m.id)::int as "memberCount"
					FROM organization o
					LEFT JOIN member m ON m.organization_id = o.id
					GROUP BY o.id, o.name, o.slug, o.logo, o.metadata, o.created_at
					ORDER BY o.created_at DESC
					LIMIT ${req.limit ?? 1000}
					OFFSET ${req.offset ?? 0}
				`,
			});

			return {
				findAll,
				findById,
				findBySlug,
				count,
				findAllWithMemberCount,
			} as const;
		}),
	},
) {}
