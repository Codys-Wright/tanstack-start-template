import * as HttpApiSchema from '@effect/platform/HttpApiSchema';
import * as Schema from 'effect/Schema';

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
