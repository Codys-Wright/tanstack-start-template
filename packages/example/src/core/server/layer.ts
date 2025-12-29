import { FeatureApiLive, FeatureRpcLive } from '../../features/feature/server';
import * as HttpApiScalar from '@effect/platform/HttpApiScalar';
import * as HttpLayerRouter from '@effect/platform/HttpLayerRouter';
import * as HttpServer from '@effect/platform/HttpServer';
import * as Layer from 'effect/Layer';
import { ExampleApi } from './api';

/**
 * ExampleApiLive - Complete HTTP API route layer for the example package.
 *
 * This creates a self-contained route layer using HttpLayerRouter.addHttpApi.
 * Includes its own Scalar docs at /api/example/docs.
 *
 * Usage in app server:
 * ```ts
 * import { ExampleApiLive } from "@example/server";
 *
 * const AllRoutes = Layer.mergeAll(
 *   ExampleApiLive,
 *   TodosApiRoutes,
 *   // ...other routes
 * );
 * ```
 */
export const ExampleApiLive = Layer.mergeAll(
  HttpLayerRouter.addHttpApi(ExampleApi),
  HttpApiScalar.layerHttpLayerRouter({
    api: ExampleApi,
    path: '/api/example/docs',
    scalar: {
      theme: 'default',
      layout: 'modern',
      darkMode: true,
      defaultOpenAllTags: true,
    },
  }),
).pipe(Layer.provide(FeatureApiLive), Layer.provide(HttpServer.layerContext));

/**
 * ExampleRpcLive - RPC handlers layer for the example feature.
 * Provides RPC method implementations.
 *
 * Usage in app server:
 * ```ts
 * import { ExampleRpcLive } from "@example/server";
 *
 * const RpcRouter = RpcServer.layerHttpRouter({...}).pipe(
 *   Layer.provide(ExampleRpcLive)
 * );
 * ```
 */
export const ExampleRpcLive = FeatureRpcLive;
