import * as HttpApiSchema from '@effect/platform/HttpApiSchema';
import * as Schema from 'effect/Schema';
import { faker } from '@faker-js/faker';
import { User, UserId } from '@auth/features/user/domain/schema';

// ============================================================================
// Auth Errors (client-safe, can be used in API definitions)
// ============================================================================

/**
 * Error thrown when authentication is required but no valid session exists.
 */
export class Unauthenticated extends Schema.TaggedError<Unauthenticated>()(
  'Unauthenticated',
  {},
  HttpApiSchema.annotations({ status: 401 }),
) {}

/**
 * Generic auth error - wraps Better Auth error responses.
 * Will be refined into specific error types (InvalidCredentials, UserAlreadyExists, etc.)
 * in future iterations.
 */
export class AuthError extends Schema.TaggedError<AuthError>()(
  'AuthError',
  {
    message: Schema.String,
    code: Schema.optional(Schema.String),
  },
  HttpApiSchema.annotations({ status: 400 }),
) {}

/**
 * Helper to convert Better Auth error response to AuthError
 */
export const toAuthError = (error: unknown): AuthError => {
  if (error && typeof error === 'object' && 'message' in error) {
    return new AuthError({
      message: String((error as { message: unknown }).message),
      code: 'code' in error ? String((error as { code: unknown }).code) : undefined,
    });
  }
  return new AuthError({ message: String(error) });
};

// ============================================================================
// Session Schemas
// ============================================================================

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

// ============================================================================
// Sign In
// ============================================================================

/**
 * Input for POST /api/auth/sign-in/email
 */
export class SignInInput extends Schema.Class<SignInInput>('SignInInput')({
  email: Schema.String.pipe(
    Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
      message: () => 'Invalid email address',
    }),
  ).annotations({
    arbitrary: () => (fc: any) => fc.constant(null).map(() => faker.internet.email()),
  }),
  password: Schema.String.pipe(
    Schema.minLength(8, {
      message: () => 'Password must be at least 8 characters',
    }),
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
export class SignInResponse extends Schema.Class<SignInResponse>('SignInResponse')({
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
export class SignUpInput extends Schema.Class<SignUpInput>('SignUpInput')({
  name: Schema.String.pipe(
    Schema.nonEmptyString({
      message: () => 'Name is required',
    }),
  ).annotations({
    arbitrary: () => (fc: any) => fc.constant(null).map(() => faker.person.fullName()),
  }),
  email: Schema.String.pipe(
    Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
      message: () => 'Invalid email address',
    }),
  ).annotations({
    arbitrary: () => (fc: any) => fc.constant(null).map(() => faker.internet.email()),
  }),
  password: Schema.String.pipe(
    Schema.minLength(8, {
      message: () => 'Password must be at least 8 characters',
    }),
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
export class SignUpResponse extends Schema.Class<SignUpResponse>('SignUpResponse')({
  token: Schema.NullOr(Schema.String),
  user: User,
}) {}

// ============================================================================
// Sign Out
// ============================================================================

/**
 * Response from POST /api/auth/sign-out
 */
export class SignOutResponse extends Schema.Class<SignOutResponse>('SignOutResponse')({
  success: Schema.Boolean,
}) {}

// ============================================================================
// Password Reset (Forgot Password Flow)
// ============================================================================

/**
 * Input for POST /api/auth/forgot-password
 * Initiates password reset flow by sending email with reset link
 */
export class ForgotPasswordInput extends Schema.Class<ForgotPasswordInput>('ForgotPasswordInput')({
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)).annotations({
    arbitrary: () => (fc: any) => fc.constant(null).map(() => faker.internet.email()),
  }),
  redirectTo: Schema.optional(Schema.String),
}) {}

/**
 * Input for POST /api/auth/reset-password
 * Completes password reset flow using token from email
 */
export class ResetPasswordInput extends Schema.Class<ResetPasswordInput>('ResetPasswordInput')({
  newPassword: Schema.String.pipe(Schema.minLength(8)).annotations({
    arbitrary: () => (fc: any) =>
      fc.constant(null).map(() => faker.internet.password({ length: 12 })),
  }),
  token: Schema.optional(Schema.NullOr(Schema.String)),
}) {}

// ============================================================================
// Standard Response Types (Better Auth uses { status: boolean } pattern)
// ============================================================================

/**
 * Standard status response - used by Better Auth for most operations
 * Note: Better Auth uses `status` not `success` for most responses
 */
export const StatusResponse = Schema.Struct({
  status: Schema.Boolean,
});
export type StatusResponse = typeof StatusResponse.Type;

/**
 * Standard status response with optional message
 */
export const StatusResponseWithMessage = Schema.Struct({
  status: Schema.Boolean,
  message: Schema.optional(Schema.String),
});
export type StatusResponseWithMessage = typeof StatusResponseWithMessage.Type;

// ============================================================================
// Email Verification
// ============================================================================

/**
 * Input for POST /api/auth/send-verification-email
 */
export const SendVerificationEmailInput = Schema.Struct({
  email: Schema.String,
  callbackURL: Schema.optional(Schema.String),
});
export type SendVerificationEmailInput = typeof SendVerificationEmailInput.Type;

/**
 * Response from email verification
 */
export const VerifyEmailResponse = Schema.Struct({
  user: User,
  status: Schema.Boolean,
});
export type VerifyEmailResponse = typeof VerifyEmailResponse.Type;

// ============================================================================
// Social Sign In
// ============================================================================

/**
 * Input for POST /api/auth/sign-in/social
 */
export const SocialSignInInput = Schema.Struct({
  provider: Schema.String,
  callbackURL: Schema.optional(Schema.String),
  errorCallbackURL: Schema.optional(Schema.String),
  newUserCallbackURL: Schema.optional(Schema.String),
  disableRedirect: Schema.optional(Schema.Boolean),
  scopes: Schema.optional(Schema.mutable(Schema.Array(Schema.String))),
  requestSignUp: Schema.optional(Schema.Boolean),
  loginHint: Schema.optional(Schema.String),
  idToken: Schema.optional(
    Schema.Struct({
      token: Schema.String,
      nonce: Schema.optional(Schema.String),
      accessToken: Schema.optional(Schema.String),
      refreshToken: Schema.optional(Schema.String),
      expiresAt: Schema.optional(Schema.Number),
    }),
  ),
});
export type SocialSignInInput = typeof SocialSignInInput.Type;

/**
 * Response from social sign in - can be redirect URL or session data
 */
export const SocialSignInResponse = Schema.Struct({
  redirect: Schema.Boolean,
  url: Schema.optional(Schema.String),
  token: Schema.optional(Schema.String),
  user: Schema.optional(User),
});
export type SocialSignInResponse = typeof SocialSignInResponse.Type;

// ============================================================================
// Link Social Account
// ============================================================================

/**
 * Input for POST /api/auth/link-social
 */
export const LinkSocialInput = Schema.Struct({
  provider: Schema.String,
  callbackURL: Schema.optional(Schema.String),
  errorCallbackURL: Schema.optional(Schema.String),
  disableRedirect: Schema.optional(Schema.Boolean),
  scopes: Schema.optional(Schema.mutable(Schema.Array(Schema.String))),
  idToken: Schema.optional(
    Schema.Struct({
      token: Schema.String,
      nonce: Schema.optional(Schema.String),
      accessToken: Schema.optional(Schema.String),
      refreshToken: Schema.optional(Schema.String),
    }),
  ),
});
export type LinkSocialInput = typeof LinkSocialInput.Type;

/**
 * Response from link social account
 */
export const LinkSocialResponse = Schema.Struct({
  redirect: Schema.Boolean,
  url: Schema.optional(Schema.String),
  status: Schema.optional(Schema.Boolean),
});
export type LinkSocialResponse = typeof LinkSocialResponse.Type;

// ============================================================================
// Anonymous Sign In
// ============================================================================

/**
 * Response from POST /api/auth/sign-in/anonymous
 */
export const AnonymousSignInResponse = Schema.Struct({
  token: Schema.String,
  user: User,
});
export type AnonymousSignInResponse = typeof AnonymousSignInResponse.Type;

// ============================================================================
// Verify Email Query Params (GET endpoint)
// ============================================================================

/**
 * Query params for GET /api/auth/verify-email
 */
export class VerifyEmailParams extends Schema.Class<VerifyEmailParams>('VerifyEmailParams')({
  token: Schema.String,
  callbackURL: Schema.optional(Schema.String),
}) {}
