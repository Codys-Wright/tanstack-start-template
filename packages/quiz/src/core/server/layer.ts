import * as HttpApiScalar from '@effect/platform/HttpApiScalar';
import * as HttpLayerRouter from '@effect/platform/HttpLayerRouter';
import * as HttpServer from '@effect/platform/HttpServer';
import * as Layer from 'effect/Layer';
import { QuizApi } from './api.js';

/**
 * QuizApiLive - Complete HTTP API route layer for the quiz package.
 *
 * This creates a self-contained route layer using HttpLayerRouter.addHttpApi.
 * Includes its own Scalar docs at /api/quiz/docs.
 *
 * Usage in app server:
 * ```ts
 * import { QuizApiLive } from "@quiz/server";
 *
 * const AllRoutes = Layer.mergeAll(
 *   QuizApiLive,
 *   // ...other routes
 * );
 * ```
 */
export const QuizApiLive = Layer.mergeAll(
  HttpLayerRouter.addHttpApi(QuizApi),
  HttpApiScalar.layerHttpLayerRouter({
    api: QuizApi,
    path: '/api/quiz/docs',
    scalar: {
      theme: 'default',
      layout: 'modern',
      darkMode: true,
      defaultOpenAllTags: true,
    },
  }),
).pipe(Layer.provide(HttpServer.layerContext));

/**
 * QuizRpcLive - RPC handlers layer for the quiz package.
 * Provides RPC method implementations.
 *
 * TODO: Add RPC live layers as features are implemented
 */
export const QuizRpcLive = Layer.empty;
