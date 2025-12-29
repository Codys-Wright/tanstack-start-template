import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint';
import * as HttpApiGroup from '@effect/platform/HttpApiGroup';
import {
  AuthError,
  SessionData,
  Unauthenticated,
  SignInInput,
  SignInResponse,
  SignUpInput,
  SignUpResponse,
  SignOutResponse,
} from './schema.js';

/**
 * SessionApiGroup - HTTP API group for session/authentication operations.
 * This is composed into AuthApi.
 *
 * Endpoints:
 * - GET /session - Get current session (returns null if not authenticated)
 * - POST /sign-in/email - Sign in with email/password
 * - POST /sign-up/email - Sign up with email/password
 * - POST /sign-out - Sign out current session
 */
export class SessionApiGroup extends HttpApiGroup.make('session')
  .add(HttpApiEndpoint.get('getSession', '/session').addSuccess(SessionData))
  .add(
    HttpApiEndpoint.post('signInEmail', '/sign-in/email')
      .setPayload(SignInInput)
      .addSuccess(SignInResponse)
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('signUpEmail', '/sign-up/email')
      .setPayload(SignUpInput)
      .addSuccess(SignUpResponse)
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('signOut', '/sign-out')
      .addSuccess(SignOutResponse)
      .addError(Unauthenticated),
  ) {}
