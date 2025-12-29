import { TodoApiLive, TodoRpcLive } from '../../features/todo/server';
import * as HttpApiScalar from '@effect/platform/HttpApiScalar';
import * as HttpLayerRouter from '@effect/platform/HttpLayerRouter';
import * as HttpServer from '@effect/platform/HttpServer';
import * as Layer from 'effect/Layer';
import { TodoPackageApi } from './api';

/**
 * TodoApiRoutes - Complete HTTP API route layer for the todo package.
 *
 * This creates a self-contained route layer using HttpLayerRouter.addHttpApi.
 * Includes its own Scalar docs at /api/todo/docs.
 *
 * Usage in app server:
 * ```ts
 * import { TodoApiRoutes } from "@todo/server";
 *
 * const AllRoutes = Layer.mergeAll(
 *   TodoApiRoutes,
 *   ExampleApiLive,
 *   // ...other routes
 * );
 * ```
 */
export const TodoApiRoutes = Layer.mergeAll(
  HttpLayerRouter.addHttpApi(TodoPackageApi),
  HttpApiScalar.layerHttpLayerRouter({
    api: TodoPackageApi,
    path: '/api/todo/docs',
    scalar: {
      theme: 'default',
      layout: 'modern',
      darkMode: true,
      defaultOpenAllTags: true,
    },
  }),
).pipe(Layer.provide(TodoApiLive), Layer.provide(HttpServer.layerContext));

/**
 * TodoRpcRoutes - RPC handlers layer for the todo feature.
 * Provides RPC method implementations.
 *
 * Usage in app server:
 * ```ts
 * import { TodoRpcRoutes } from "@todo/server";
 *
 * const RpcRouter = RpcServer.layerHttpRouter({...}).pipe(
 *   Layer.provide(TodoRpcRoutes)
 * );
 * ```
 */
export const TodoRpcRoutes = TodoRpcLive;
