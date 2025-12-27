import * as Schema from "effect/Schema";

/**
 * Branded Organization ID type for type safety
 */
export const OrganizationId = Schema.String.pipe(
  Schema.brand("OrganizationId")
);
export type OrganizationId = typeof OrganizationId.Type;

/**
 * Organization entity
 */
export class Organization extends Schema.Class<Organization>("Organization")({
  id: OrganizationId,
  name: Schema.String,
  slug: Schema.String,
  logo: Schema.NullOr(Schema.String),
  metadata: Schema.optional(Schema.Unknown), // JSON metadata
  createdAt: Schema.DateTimeUtc,
}) {}
