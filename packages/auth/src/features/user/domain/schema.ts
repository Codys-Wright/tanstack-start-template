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
 *
 * Includes two-factor plugin fields:
 * - twoFactorEnabled: Whether 2FA is enabled
 *
 * Includes anonymous plugin fields:
 * - isAnonymous: Whether this is an anonymous user
 *
 * Custom fields:
 * - fake: Whether this is a fake/test user (readOnly)
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
  banReason: Schema.optional(Schema.NullOr(Schema.String)),
  banExpires: Schema.optional(Schema.NullOr(Schema.DateTimeUtc)),

  // Two-factor plugin field
  twoFactorEnabled: Schema.optional(Schema.Boolean),

  // Anonymous plugin field
  isAnonymous: Schema.optional(Schema.Boolean),

  // Custom fields (readOnly)
  fake: Schema.optional(Schema.Boolean),
}) {}
