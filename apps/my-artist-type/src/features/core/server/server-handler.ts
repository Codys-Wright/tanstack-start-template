import {
  AuthContext,
  BetterAuthRouter,
  RpcAuthenticationMiddlewareLive,
  AuthService,
  AuthApiRoutes,
} from '@auth/server';
import { AuthApi } from '@auth';
import { TodosApi } from '@todo';
import { TodosApiRoutes, TodosRpcLive } from '@todo/server';
import * as HttpApi from '@effect/platform/HttpApi';
import * as HttpApiScalar from '@effect/platform/HttpApiScalar';
import * as HttpLayerRouter from '@effect/platform/HttpLayerRouter';
import * as HttpServerResponse from '@effect/platform/HttpServerResponse';
import * as OpenApi from '@effect/platform/OpenApi';
import * as RpcSerialization from '@effect/rpc/RpcSerialization';
import * as RpcServer from '@effect/rpc/RpcServer';
import * as Context from 'effect/Context';
import * as Layer from 'effect/Layer';
import * as Effect from 'effect/Effect';
import * as Logger from 'effect/Logger';
import { DomainRpc, RpcLoggerLive } from './domain';

const RpcRouter = RpcServer.layerHttpRouter({
  group: DomainRpc,
  path: '/api/rpc',
  protocol: 'http',
  spanPrefix: 'rpc',
  disableFatalDefects: true,
}).pipe(
  Layer.provide(TodosRpcLive),
  Layer.provide(RpcLoggerLive),
  Layer.provide(RpcAuthenticationMiddlewareLive),
  Layer.provide(AuthService.Default),
  Layer.provide(RpcSerialization.layerNdjson),
);

// ============================================================================
// HTTP API Setup - Routes imported from feature packages
// ============================================================================

// TodosApiRoutes and AuthApiRoutes are imported from their respective packages
// Each package provides pre-configured routes with middleware

// ============================================================================
// OpenAPI Documentation - Composed API for docs only
// ============================================================================

/**
 * DocsApi - Composed API for OpenAPI documentation.
 * Combines all feature APIs for unified Scalar docs.
 */
class DocsApi extends HttpApi.make('docs-api')
  .addHttpApi(TodosApi)
  .addHttpApi(AuthApi)
  .prefix('/api')
  .annotateContext(
    OpenApi.annotations({
      title: 'TanStack Start API',
      description: 'API for the TanStack Start application',
      version: '1.0.0',
    }),
  ) {}

// Scalar docs from composed DocsApi
const ScalarDocs = HttpApiScalar.layerHttpLayerRouter({
  api: DocsApi,
  path: '/api/docs',
  scalar: {
    theme: 'moon',
    layout: 'modern',
    darkMode: true,
    defaultOpenAllTags: true,
  },
});

// ============================================================================
// Other Routes
// ============================================================================

const HealthRoute = HttpLayerRouter.use((router) =>
  router.add('GET', '/api/health', HttpServerResponse.text('OK')),
);

// ============================================================================
// Compose All Routes
// ============================================================================

// Merge all routes - individual APIs + RPC + other routes
// Note: AuthContext.Mock is provided to satisfy type requirements, but the middleware
// provides the actual AuthContext at runtime per-request
const AllRoutes = Layer.mergeAll(
  RpcRouter,
  TodosApiRoutes,
  AuthApiRoutes,
  ScalarDocs,
  HealthRoute,
  BetterAuthRouter,
).pipe(
  Layer.provideMerge(AuthService.Default),
  Layer.provide(Layer.mergeAll(AuthContext.Mock, Logger.pretty)),
);

// ============================================================================
// Web Handler Export
// ============================================================================

const memoMap = Effect.runSync(Layer.makeMemoMap);

const { handler, dispose } = HttpLayerRouter.toWebHandler(AllRoutes, {
  memoMap,
});

// Export dispose for potential graceful shutdown handling
export { dispose };

// Revert to original pattern - the Context.empty() is needed for TanStack Start integration
export const effectHandler = ({ request }: { request: Request }) =>
  handler(request, Context.empty() as any);
