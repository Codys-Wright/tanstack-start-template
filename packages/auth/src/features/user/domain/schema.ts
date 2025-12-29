import * as Schema from 'effect/Schema';

/**
 * Branded string type for user identifiers.
 * Better Auth uses non-UUID strings for user IDs by default.
 * Used across authentication and authorization contexts.
 */
export const UserId = Schema.String.pipe(Schema.brand('UserId'));
export type UserId = typeof UserId.Type;

/**
 * User entity matching Better Auth OpenAPI spec
 *
 * Includes admin plugin fields:
 * - role: User's global role (admin, user, etc.)
 * - banned: Whether user is banned
 * - banReason: Reason for ban
 * - banExpires: When ban expires
 */
export class User extends Schema.Class<User>('User')({
  id: UserId,
  name: Schema.String,
  email: Schema.String,
  emailVerified: Schema.Boolean,
  image: Schema.NullOr(Schema.String),
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,

  // Admin plugin fields
  role: Schema.optional(Schema.String),
  banned: Schema.optional(Schema.Boolean),
  banReason: Schema.optional(Schema.String),
  banExpires: Schema.optional(Schema.NullOr(Schema.DateTimeUtc)),
}) {}
