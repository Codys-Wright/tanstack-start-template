import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint';
import * as HttpApiGroup from '@effect/platform/HttpApiGroup';
import { Unauthenticated } from '../_core/service.js';
import { AuthError } from '../_core/errors.js';
import { SessionData } from './session.schema.js';
import {
  SignInInput,
  SignInResponse,
  SignUpInput,
  SignUpResponse,
  SignOutResponse,
} from '../_core/schema.js';

/**
 * SessionApiGroup - HTTP API for session/authentication operations
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
