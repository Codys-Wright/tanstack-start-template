import * as Schema from "effect/Schema";
import { UserId } from "./user-id.js";

/**
 * User schema matching Better Auth OpenAPI spec.
 * Represents the authenticated user's profile data.
 */
export const User = Schema.Struct({
  id: UserId,
  name: Schema.String,
  email: Schema.String,
  emailVerified: Schema.Boolean,
  image: Schema.NullOr(Schema.String),
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
});
export type User = typeof User.Type;

/**
 * Session schema matching Better Auth OpenAPI spec.
 * Represents an active authentication session.
 */
export const Session = Schema.Struct({
  id: Schema.String,
  expiresAt: Schema.DateTimeUtc,
  token: Schema.String,
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
  ipAddress: Schema.optional(Schema.String),
  userAgent: Schema.optional(Schema.String),
  userId: UserId,
});
export type Session = typeof Session.Type;

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

/**
 * Response from POST /api/auth/sign-in/email
 */
export const SignInResponse = Schema.Struct({
  redirect: Schema.Literal(false),
  token: Schema.String,
  user: User,
  url: Schema.NullOr(Schema.String),
});
export type SignInResponse = typeof SignInResponse.Type;

/**
 * Input for POST /api/auth/sign-in/email
 */
export const SignInInput = Schema.Struct({
  email: Schema.String,
  password: Schema.String,
  callbackURL: Schema.optional(Schema.String),
  rememberMe: Schema.optional(Schema.Boolean),
});
export type SignInInput = typeof SignInInput.Type;

/**
 * Response from POST /api/auth/sign-up/email
 */
export const SignUpResponse = Schema.Struct({
  token: Schema.NullOr(Schema.String),
  user: User,
});
export type SignUpResponse = typeof SignUpResponse.Type;

/**
 * Input for POST /api/auth/sign-up/email
 */
export const SignUpInput = Schema.Struct({
  name: Schema.String,
  email: Schema.String,
  password: Schema.String,
  image: Schema.optional(Schema.String),
  callbackURL: Schema.optional(Schema.String),
  rememberMe: Schema.optional(Schema.Boolean),
});
export type SignUpInput = typeof SignUpInput.Type;

/**
 * Response from POST /api/auth/sign-out
 */
export const SignOutResponse = Schema.Struct({
  success: Schema.Boolean,
});
export type SignOutResponse = typeof SignOutResponse.Type;
