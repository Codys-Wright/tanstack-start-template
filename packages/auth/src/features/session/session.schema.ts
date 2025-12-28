import * as Schema from 'effect/Schema';
import { User, UserId } from '../user/user.schema.js';

/**
 * Session entity matching Better Auth OpenAPI spec
 *
 * Includes organization plugin fields:
 * - activeOrganizationId: Currently active organization
 * - activeTeamId: Currently active team
 *
 * Includes admin plugin fields:
 * - impersonatedBy: ID of admin impersonating this session
 */
export class Session extends Schema.Class<Session>('Session')({
  id: Schema.String,
  expiresAt: Schema.DateTimeUtc,
  token: Schema.String,
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
  ipAddress: Schema.optional(Schema.String),
  userAgent: Schema.optional(Schema.String),
  userId: UserId,

  // Organization plugin fields
  activeOrganizationId: Schema.optional(Schema.NullOr(Schema.String)),
  activeTeamId: Schema.optional(Schema.NullOr(Schema.String)),

  // Admin plugin field
  impersonatedBy: Schema.optional(Schema.NullOr(Schema.String)),
}) {}

/**
 * Active session view with additional metadata
 * Used for displaying user's current sessions in security settings
 */
export const ActiveSession = Schema.Struct({
  id: Schema.String,
  token: Schema.String,
  userAgent: Schema.NullOr(Schema.String),
  ipAddress: Schema.NullOr(Schema.String),
  createdAt: Schema.DateTimeUtc,
  expiresAt: Schema.DateTimeUtc,
  isCurrent: Schema.Boolean,
});
export type ActiveSession = typeof ActiveSession.Type;

/**
 * Response from GET /api/auth/get-session
 * Returns null when not authenticated, or session + user data when authenticated.
 */
export const SessionData = Schema.NullOr(
  Schema.Struct({
    session: Session,
    user: User,
  }),
);
export type SessionData = typeof SessionData.Type;
