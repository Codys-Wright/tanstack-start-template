import * as HttpLayerRouter from '@effect/platform/HttpLayerRouter';
import * as HttpServer from '@effect/platform/HttpServer';
import * as Layer from 'effect/Layer';
import { AuthApi } from '@auth/core/auth-api';
import { AuthApiLive } from './auth-api-live';
import { HttpAuthenticationMiddlewareLive } from './middleware';
import { AuthService } from './service';

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
