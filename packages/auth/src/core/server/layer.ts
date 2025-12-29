import { SessionApiLive } from '../../features/session/server/api-live.js';
import { AccountApiLive } from '../../features/account/server/api-live.js';
import { OrganizationApiLive } from '../../features/organization/server/api-live.js';
import * as HttpApiScalar from '@effect/platform/HttpApiScalar';
import * as HttpLayerRouter from '@effect/platform/HttpLayerRouter';
import * as HttpServer from '@effect/platform/HttpServer';
import * as Layer from 'effect/Layer';
import { AuthApi } from './api.js';
import {
  HttpAuthenticationMiddlewareLive,
  AuthService,
} from '../../features/session/server/index.js';

/**
 * AuthApiLive - All Auth API handlers composed together.
 *
 * Uses AuthApi directly - no complex generics or type casting needed.
 * Compose with HttpLayerRouter.addHttpApi(AuthApi) at the server level.
 *
 * Includes handlers for:
 * - session: Sign in, sign up, sign out, get session
 * - account: Profile management, change email/password, delete account
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
export const AuthApiLive = Layer.mergeAll(SessionApiLive, AccountApiLive);

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
