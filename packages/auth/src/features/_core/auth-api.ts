import * as HttpApi from '@effect/platform/HttpApi';
import { AccountApiGroup } from '../account/account-api.js';
import { SessionApiGroup } from '../session/session-api.js';

/**
 * AuthApi - Composed HTTP API for authentication operations
 *
 * Provides typed Effect endpoints for auth operations.
 * Coexists with Better Auth's passthrough (Better Auth handles
 * routes not defined here).
 *
 * Groups:
 * - session: Sign in, sign up, sign out, get session (/session/*)
 * - account: Profile management, change email/password, delete account (/account/*)
 *
 * Note: No prefix here - composed at app level with AppApi.
 */
export class AuthApi extends HttpApi.make('auth-api').add(SessionApiGroup).add(AccountApiGroup) {}
