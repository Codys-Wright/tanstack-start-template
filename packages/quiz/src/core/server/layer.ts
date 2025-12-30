import * as HttpApiScalar from '@effect/platform/HttpApiScalar';
import * as HttpLayerRouter from '@effect/platform/HttpLayerRouter';
import * as HttpServer from '@effect/platform/HttpServer';
import * as Layer from 'effect/Layer';
import { AnalysisRpcLive } from '../../features/analysis/server/index.js';
import { AnalysisEngineRpcLive } from '../../features/analysis-engine/server/index.js';
import { QuizzesRpcLive } from '../../features/quiz/server/index.js';
import { ActiveQuizRpcLive } from '../../features/active-quiz/server/index.js';
import { ResponsesRpcLive } from '../../features/responses/server/index.js';
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
 * QuizRpcLive - Combined RPC handlers layer for the quiz package.
 * Merges all feature-level RPC implementations.
 *
 * Currently includes:
 * - QuizzesRpcLive: Quiz CRUD operations
 * - AnalysisRpcLive: Analysis result operations
 * - AnalysisEngineRpcLive: Analysis engine CRUD operations
 * - ActiveQuizRpcLive: Active quiz CRUD operations
 * - ResponsesRpcLive: Quiz response CRUD operations
 */
export const QuizRpcLive = Layer.mergeAll(
  QuizzesRpcLive,
  AnalysisRpcLive,
  AnalysisEngineRpcLive,
  ActiveQuizRpcLive,
  ResponsesRpcLive,
);
