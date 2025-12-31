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
  SocialSignInInput,
  SocialSignInResponse,
  SendVerificationEmailInput,
  VerifyEmailResponse,
  VerifyEmailParams,
  StatusResponse,
  ForgotPasswordInput,
  ResetPasswordInput,
  LinkSocialInput,
  LinkSocialResponse,
  AnonymousSignInResponse,
} from './schema';

/**
 * SessionApiGroup - HTTP API group for session/authentication operations.
 * This is composed into AuthApi.
 *
 * Endpoints:
 * - GET /session - Get current session (returns null if not authenticated)
 * - POST /sign-in/email - Sign in with email/password
 * - POST /sign-in/social - Sign in with social provider (Google, etc.)
 * - POST /sign-in/anonymous - Sign in anonymously (no credentials required)
 * - POST /sign-up/email - Sign up with email/password
 * - POST /sign-out - Sign out current session
 * - POST /send-verification-email - Send email verification link
 * - GET /verify-email - Verify email with token
 * - POST /forgot-password - Request password reset email
 * - POST /reset-password - Reset password with token
 * - POST /link-social - Link social account to existing user
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
    HttpApiEndpoint.post('signInSocial', '/sign-in/social')
      .setPayload(SocialSignInInput)
      .addSuccess(SocialSignInResponse)
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('signInAnonymous', '/sign-in/anonymous')
      .addSuccess(AnonymousSignInResponse)
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
  )
  .add(
    HttpApiEndpoint.post('sendVerificationEmail', '/send-verification-email')
      .setPayload(SendVerificationEmailInput)
      .addSuccess(StatusResponse)
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.get('verifyEmail', '/verify-email')
      .setUrlParams(VerifyEmailParams)
      .addSuccess(VerifyEmailResponse)
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('forgotPassword', '/forgot-password')
      .setPayload(ForgotPasswordInput)
      .addSuccess(StatusResponse)
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('resetPassword', '/reset-password')
      .setPayload(ResetPasswordInput)
      .addSuccess(StatusResponse)
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('linkSocial', '/link-social')
      .setPayload(LinkSocialInput)
      .addSuccess(LinkSocialResponse)
      .addError(AuthError)
      .addError(Unauthenticated),
  ) {}
