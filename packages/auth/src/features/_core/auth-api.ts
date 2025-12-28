import * as HttpApi from '@effect/platform/HttpApi';
import * as OpenApi from '@effect/platform/OpenApi';
import { SessionApiGroup } from '../session/session-api.js';

/**
 * AuthHttpApi - Composed HTTP API for authentication operations
 *
 * Mounted at /effect-auth to coexist with Better Auth's /auth passthrough.
 *
 * Current groups:
 * - session: Sign in, sign up, sign out, get session
 *
 * Future groups (to be added):
 * - user: Update profile, delete account
 * - account: Change email/password, password reset, session management
 */
export class AuthHttpApi extends HttpApi.make('effect-auth')
  .add(SessionApiGroup)
  .prefix('/effect-auth')
  .annotateContext(
    OpenApi.annotations({
      title: 'Effect Auth API',
      description: 'Typed authentication API with Effect HttpApi',
      version: '1.0.0',
    }),
  ) {}
