import { faker } from "@faker-js/faker";
import * as Schema from "effect/Schema";
import { UserId } from "./../user";

/**
 * Account entity matching Better Auth OpenAPI spec
 * Represents a linked authentication provider (social login, passkey, etc.)
 */
export class Account extends Schema.Class<Account>("Account")({
  id: Schema.String,
  accountId: Schema.String,
  providerId: Schema.String,
  userId: UserId,
  accessToken: Schema.optional(Schema.NullOr(Schema.String)),
  refreshToken: Schema.optional(Schema.NullOr(Schema.String)),
  idToken: Schema.optional(Schema.NullOr(Schema.String)),
  accessTokenExpiresAt: Schema.optional(Schema.NullOr(Schema.DateTimeUtc)),
  refreshTokenExpiresAt: Schema.optional(Schema.NullOr(Schema.DateTimeUtc)),
  scope: Schema.optional(Schema.NullOr(Schema.String)),
  password: Schema.optional(Schema.NullOr(Schema.String)),
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
}) {}

/**
 * Verification entity matching Better Auth OpenAPI spec
 * Used for email verification, password reset, etc.
 */
export class Verification extends Schema.Class<Verification>("Verification")({
  id: Schema.String,
  identifier: Schema.String,
  value: Schema.String,
  expiresAt: Schema.DateTimeUtc,
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
}) {}

/**
 * Update user profile input
 */
export const UpdateUserInput = Schema.Struct({
  name: Schema.optional(
    Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
  ),
  image: Schema.optional(Schema.NullOr(Schema.String)),
});
export type UpdateUserInput = typeof UpdateUserInput.Type;

/**
 * Delete account input (requires password confirmation)
 */
export const DeleteAccountInput = Schema.Struct({
  password: Schema.String.pipe(
    Schema.minLength(1, {
      message: () => "Password is required",
    }),
  ),
});
export type DeleteAccountInput = typeof DeleteAccountInput.Type;

/**
 * Input for POST /api/auth/change-email
 * Change user's email address (requires verification)
 */
export class ChangeEmailInput extends Schema.Class<ChangeEmailInput>(
  "ChangeEmailInput",
)({
  newEmail: Schema.String.pipe(
    Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  ).annotations({
    arbitrary: () => (fc: any) =>
      fc.constant(null).map(() => faker.internet.email()),
  }),
  callbackURL: Schema.optional(Schema.String),
}) {}

/**
 * Input for POST /api/auth/change-password
 * Change user's password (requires current password)
 */
export class ChangePasswordInput extends Schema.Class<ChangePasswordInput>(
  "ChangePasswordInput",
)({
  currentPassword: Schema.String,
  newPassword: Schema.String.pipe(Schema.minLength(8)).annotations({
    arbitrary: () => (fc: any) =>
      fc.constant(null).map(() => faker.internet.password({ length: 12 })),
  }),
  revokeOtherSessions: Schema.optional(Schema.Boolean),
}) {}
