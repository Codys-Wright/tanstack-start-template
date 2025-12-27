import { faker } from "@faker-js/faker";
import * as Schema from "effect/Schema";
import { User } from "./user.schema.js";
import { Session } from "./session.schema.js";

/**
 * Response from GET /api/auth/get-session
 * Returns null when not authenticated, or session + user data when authenticated.
 */
export const SessionData = Schema.NullOr(
  Schema.Struct({
    session: Session,
    user: User,
  })
);
export type SessionData = typeof SessionData.Type;

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
 * Response from POST /api/auth/sign-up/email
 */
export class SignUpResponse extends Schema.Class<SignUpResponse>(
  "SignUpResponse"
)({
  token: Schema.NullOr(Schema.String),
  user: User,
}) {}

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
 * Response from POST /api/auth/sign-out
 */
export class SignOutResponse extends Schema.Class<SignOutResponse>(
  "SignOutResponse"
)({
  success: Schema.Boolean,
}) {}

/**
 * Input for POST /api/auth/forgot-password
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

/**
 * Input for POST /api/auth/change-email
 */
export class ChangeEmailInput extends Schema.Class<ChangeEmailInput>(
  "ChangeEmailInput"
)({
  newEmail: Schema.String.pipe(
    Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  ).annotations({
    arbitrary: () => (fc: any) =>
      fc.constant(null).map(() => faker.internet.email()),
  }),
  callbackURL: Schema.optional(Schema.String),
}) {}

/**
 * Input for POST /api/auth/change-password
 */
export class ChangePasswordInput extends Schema.Class<ChangePasswordInput>(
  "ChangePasswordInput"
)({
  currentPassword: Schema.String,
  newPassword: Schema.String.pipe(Schema.minLength(8)).annotations({
    arbitrary: () => (fc: any) =>
      fc.constant(null).map(() => faker.internet.password({ length: 12 })),
  }),
  revokeOtherSessions: Schema.optional(Schema.Boolean),
}) {}
