import { AuthService, HttpAuthenticationMiddlewareLive } from '@auth/server';
import * as HttpLayerRouter from '@effect/platform/HttpLayerRouter';
import * as HttpServer from '@effect/platform/HttpServer';
import * as Layer from 'effect/Layer';
import { TodosApi } from '../domain/index.js';
import { TodosApiLive } from './todos-api-live.js';

/**
 * TodosApiRoutes - Pre-configured HTTP routes layer for the Todos API.
 *
 * Includes:
 * - TodosApiLive handlers
 * - HttpAuthenticationMiddlewareLive for auth
 * - AuthService.Default
 * - HttpServer.layerContext
 *
 * Usage in app server:
 * ```ts
 * import { TodosApiRoutes } from "@todo/server";
 *
 * const AllRoutes = Layer.mergeAll(
 *   TodosApiRoutes,
 *   AuthApiRoutes,
 *   // ...other routes
 * );
 * ```
 */
export const TodosApiRoutes = HttpLayerRouter.addHttpApi(TodosApi).pipe(
  Layer.provide(TodosApiLive),
  Layer.provide(HttpAuthenticationMiddlewareLive),
  Layer.provide(AuthService.Default),
  Layer.provide(HttpServer.layerContext),
);
