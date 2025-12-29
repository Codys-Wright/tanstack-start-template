import { QuizzesApiLive, QuizzesRpcLive } from '../../features/quiz/server/index.js';
import { AnalysisApiLive, AnalysisRpcLive } from '../../features/analysis/server/index.js';
import {
  AnalysisEngineApiLive,
  AnalysisEngineRpcLive,
} from '../../features/analysis-engine/server/index.js';
import { ResponsesApiLive, ResponsesRpcLive } from '../../features/responses/server/index.js';
import {
  ActiveQuizzesApiLive,
  ActiveQuizzesRpcLive,
} from '../../features/active-quiz/server/index.js';
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
).pipe(
  Layer.provide(QuizzesApiLive),
  Layer.provide(AnalysisApiLive),
  Layer.provide(AnalysisEngineApiLive),
  Layer.provide(ResponsesApiLive),
  Layer.provide(ActiveQuizzesApiLive),
  Layer.provide(HttpServer.layerContext),
);

/**
 * QuizRpcLive - RPC handlers layer for the quiz package.
 * Provides RPC method implementations.
 *
 * Usage in app server:
 * ```ts
 * import { QuizRpcLive } from "@quiz/server";
 *
 * const RpcRouter = RpcServer.layerHttpRouter({...}).pipe(
 *   Layer.provide(QuizRpcLive)
 * );
 * ```
 */
export const QuizRpcLive = Layer.mergeAll(
  QuizzesRpcLive,
  AnalysisRpcLive,
  AnalysisEngineRpcLive,
  ResponsesRpcLive,
  ActiveQuizzesRpcLive,
);
