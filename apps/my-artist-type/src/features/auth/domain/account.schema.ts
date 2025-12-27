import { faker } from "@faker-js/faker";
import * as Schema from "effect/Schema";
import { UserId } from "./user.schema.js";

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
