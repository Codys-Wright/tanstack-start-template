import * as HttpApiSchema from '@effect/platform/HttpApiSchema';
import * as Schema from 'effect/Schema';
import { User, UserId } from '../user/user.schema.js';

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
