import * as Schema from 'effect/Schema';
import { OrganizationId } from './organization.schema.js';

/**
 * Branded Team ID type for type safety
 */
export const TeamId = Schema.String.pipe(Schema.brand('TeamId'));
export type TeamId = typeof TeamId.Type;

/**
 * Team entity - represents a team within an organization
 */
export class Team extends Schema.Class<Team>('Team')({
  id: TeamId,
  name: Schema.String,
  organizationId: OrganizationId,
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.optional(Schema.DateTimeUtc),
}) {}
