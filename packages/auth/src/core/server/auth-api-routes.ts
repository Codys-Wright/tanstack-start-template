import * as HttpLayerRouter from '@effect/platform/HttpLayerRouter';
import * as HttpServer from '@effect/platform/HttpServer';
import * as Layer from 'effect/Layer';
import { AuthApi } from '../auth-api.js';
import { AuthApiLive } from './auth-api-live.js';
import { HttpAuthenticationMiddlewareLive } from './middleware.js';
import { AuthService } from './service.js';

/**
 * AuthApiRoutes - Pre-configured HTTP routes layer for the Auth API.
 *
 * Includes:
 * - AuthApiLive handlers (session + account)
 * - HttpAuthenticationMiddlewareLive for auth
 * - AuthService.Default
 * - HttpServer.layerContext
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
export const AuthApiRoutes = HttpLayerRouter.addHttpApi(AuthApi).pipe(
  Layer.provide(AuthApiLive),
  Layer.provide(HttpAuthenticationMiddlewareLive),
  Layer.provide(AuthService.Default),
  Layer.provide(HttpServer.layerContext),
);
