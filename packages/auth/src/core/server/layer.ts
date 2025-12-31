import { SessionApiLive } from '@auth/features/session/session-api-live';
import { AccountApiLive } from '@auth/features/account/server';
import { AdminApiLive } from '@auth/features/admin/server/api-live';
import { OrganizationApiLive } from '@auth/features/organization/server/api-live';
import { TeamApiLive } from '@auth/features/team/server/api-live';
import { MemberApiLive } from '@auth/features/member/server/api-live';
import { InvitationApiLive } from '@auth/features/invitation/server/api-live';
import { SecurityApiLive } from '@auth/features/security/server/api-live';
import * as HttpApiScalar from '@effect/platform/HttpApiScalar';
import * as HttpLayerRouter from '@effect/platform/HttpLayerRouter';
import * as HttpServer from '@effect/platform/HttpServer';
import * as Layer from 'effect/Layer';
import { AuthApi } from './api';
import { HttpAuthenticationMiddlewareLive } from '@auth/features/session/server';
import { AuthService } from '@auth/core/server/service';

/**
 * AuthApiLive - All Auth API handlers composed together.
 *
 * Uses AuthApi directly - no complex generics or type casting needed.
 * Compose with HttpLayerRouter.addHttpApi(AuthApi) at the server level.
 *
 * Includes handlers for:
 * - session: Sign in, sign up, sign out, get session
 * - account: Profile management, change email/password, delete account
 * - admin: User management, impersonation, banning
 * - organization: Organization management, members, permissions
 * - team: Team management within organizations
 * - member: Organization member management
 * - invitation: Invitation management
 * - security: 2FA, passkeys, sessions, password management
 *
 * @example
 * ```ts
 * import { AuthApi } from "@auth";
 * import { AuthApiLive } from "@auth/server";
 * import * as HttpLayerRouter from "@effect/platform/HttpLayerRouter";
 *
 * const AuthRoutes = HttpLayerRouter.addHttpApi(AuthApi).pipe(
 *   Layer.provide(AuthApiLive)
 * );
 * ```
 */
export const AuthApiLive = Layer.mergeAll(
  SessionApiLive,
  AccountApiLive,
  AdminApiLive,
  OrganizationApiLive,
  TeamApiLive,
  MemberApiLive,
  InvitationApiLive,
  SecurityApiLive,
);

/**
 * AuthApiRoutes - Pre-configured HTTP routes layer for the Auth API.
 *
 * Includes:
 * - AuthApiLive handlers (session + account)
 * - HttpAuthenticationMiddlewareLive for auth
 * - AuthService.Default
 * - HttpServer.layerContext
 * - Scalar docs at /api/auth/docs
 *
 * Usage in app server:
 * ```ts
 * import { AuthApiRoutes } from "@auth/server";
 *
 * const AllRoutes = Layer.mergeAll(
 *   TodosApiRoutes,
 *   AuthApiRoutes,
 *   // ...other routes
 * );
 * ```
 */
export const AuthApiRoutes = Layer.mergeAll(
  HttpLayerRouter.addHttpApi(AuthApi),
  HttpApiScalar.layerHttpLayerRouter({
    api: AuthApi,
    path: '/api/auth/docs',
    scalar: {
      theme: 'default',
      layout: 'modern',
      darkMode: true,
      defaultOpenAllTags: true,
    },
  }),
).pipe(
  Layer.provide(AuthApiLive),
  Layer.provide(HttpAuthenticationMiddlewareLive),
  Layer.provide(AuthService.Default),
  Layer.provide(HttpServer.layerContext),
);
