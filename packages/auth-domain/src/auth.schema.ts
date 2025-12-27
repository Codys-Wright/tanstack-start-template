import { faker } from "@faker-js/faker";
import * as Schema from "effect/Schema";
import { User } from "./user.schema.js";

/**
 * Core Authentication Schemas
 * 
 * This file contains schemas for fundamental authentication operations:
 * - Sign in / Sign up
 * - Sign out
 * - Password reset (forgot password flow)
 * 
 * Account management operations (change email/password) are in account.schema.ts
 */

// ============================================================================
// Sign In
// ============================================================================

/**
 * Input for POST /api/auth/sign-in/email
 */
export class SignInInput extends Schema.Class<SignInInput>("SignInInput")({
  email: Schema.String.pipe(
    Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
      message: () => "Invalid email address",
    })
  ).annotations({
    arbitrary: () => (fc: any) =>
      fc.constant(null).map(() => faker.internet.email()),
  }),
  password: Schema.String.pipe(
    Schema.minLength(8, {
      message: () => "Password must be at least 8 characters",
    })
  ).annotations({
    arbitrary: () => (fc: any) =>
      fc.constant(null).map(() => faker.internet.password({ length: 12 })),
  }),
  callbackURL: Schema.optional(Schema.String),
  rememberMe: Schema.optional(Schema.Boolean),
}) {}

/**
 * Response from POST /api/auth/sign-in/email
 */
export class SignInResponse extends Schema.Class<SignInResponse>(
  "SignInResponse"
)({
  redirect: Schema.Literal(false),
  token: Schema.String,
  user: User,
  url: Schema.NullOr(Schema.String),
}) {}

// ============================================================================
// Sign Up
// ============================================================================

/**
 * Input for POST /api/auth/sign-up/email
 */
export class SignUpInput extends Schema.Class<SignUpInput>("SignUpInput")({
  name: Schema.String.pipe(
    Schema.nonEmptyString({
      message: () => "Name is required",
    })
  ).annotations({
    arbitrary: () => (fc: any) =>
      fc.constant(null).map(() => faker.person.fullName()),
  }),
  email: Schema.String.pipe(
    Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
      message: () => "Invalid email address",
    })
  ).annotations({
    arbitrary: () => (fc: any) =>
      fc.constant(null).map(() => faker.internet.email()),
  }),
  password: Schema.String.pipe(
    Schema.minLength(8, {
      message: () => "Password must be at least 8 characters",
    })
  ).annotations({
    arbitrary: () => (fc: any) =>
      fc.constant(null).map(() => faker.internet.password({ length: 12 })),
  }),
  image: Schema.optional(Schema.String),
  callbackURL: Schema.optional(Schema.String),
  rememberMe: Schema.optional(Schema.Boolean),
}) {}

/**
 * Response from POST /api/auth/sign-up/email
 */
export class SignUpResponse extends Schema.Class<SignUpResponse>(
  "SignUpResponse"
)({
  token: Schema.NullOr(Schema.String),
  user: User,
}) {}

// ============================================================================
// Sign Out
// ============================================================================

/**
 * Response from POST /api/auth/sign-out
 */
export class SignOutResponse extends Schema.Class<SignOutResponse>(
  "SignOutResponse"
)({
  success: Schema.Boolean,
}) {}

// ============================================================================
// Password Reset (Forgot Password Flow)
// ============================================================================

/**
 * Input for POST /api/auth/forgot-password
 * Initiates password reset flow by sending email with reset link
 */
export class ForgotPasswordInput extends Schema.Class<ForgotPasswordInput>(
  "ForgotPasswordInput"
)({
  email: Schema.String.pipe(
    Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  ).annotations({
    arbitrary: () => (fc: any) =>
      fc.constant(null).map(() => faker.internet.email()),
  }),
  redirectTo: Schema.optional(Schema.String),
}) {}

/**
 * Input for POST /api/auth/reset-password
 * Completes password reset flow using token from email
 */
export class ResetPasswordInput extends Schema.Class<ResetPasswordInput>(
  "ResetPasswordInput"
)({
  newPassword: Schema.String.pipe(Schema.minLength(8)).annotations({
    arbitrary: () => (fc: any) =>
      fc.constant(null).map(() => faker.internet.password({ length: 12 })),
  }),
  token: Schema.String,
}) {}
