import {
  AuthContext,
  BetterAuthRouter,
  RpcAuthenticationMiddlewareLive,
  AuthService,
} from '@auth/server';
import { TodoApiRoutes, TodoRpcLive } from '@todo/server';
import { ExampleApiLive, ExampleRpcLive } from '@example/server';
import { QuizApiLive, QuizRpcLive } from '@quiz/server';
import * as HttpLayerRouter from '@effect/platform/HttpLayerRouter';
import * as HttpServerResponse from '@effect/platform/HttpServerResponse';
import * as RpcSerialization from '@effect/rpc/RpcSerialization';
import * as RpcServer from '@effect/rpc/RpcServer';
import * as Context from 'effect/Context';
import * as Layer from 'effect/Layer';
import * as Effect from 'effect/Effect';
import * as Logger from 'effect/Logger';
import { DomainRpc, RpcLoggerLive, RpcTracerLive } from './domain';
import { TracerLive } from './tracing.js';

const RpcRouter = RpcServer.layerHttpRouter({
  group: DomainRpc,
  path: '/api/rpc',
  protocol: 'http',
  // Disable built-in RPC tracing since we use RpcTracer middleware
  disableTracing: true,
  disableFatalDefects: true,
}).pipe(
  Layer.provide(TodoRpcLive),
  Layer.provide(ExampleRpcLive),
  Layer.provide(QuizRpcLive),
  Layer.provide(RpcTracerLive),
  Layer.provide(RpcLoggerLive),
  Layer.provide(RpcAuthenticationMiddlewareLive),
  Layer.provide(AuthService.Default),
  Layer.provide(RpcSerialization.layerNdjson),
);

const HealthRoute = HttpLayerRouter.use((router) =>
  router.add('GET', '/api/health', HttpServerResponse.text('OK')),
);

// Each package provides its own complete route layer with docs:
// - TodosApiRoutes: /api/todos/* routes + docs at its path
// - ExampleApiLive: /api/features/* routes + docs at /api/example/docs
// - QuizApiLive: /api/quiz/* routes + docs at /api/quiz/docs
// - AuthApiRoutes: /api/auth/* routes
const AllRoutes = Layer.mergeAll(
  RpcRouter,
  TodoApiRoutes,
  ExampleApiLive,
  QuizApiLive,
  HealthRoute,
  BetterAuthRouter,
).pipe(
  Layer.provideMerge(AuthService.Default),
  Layer.provide(Layer.mergeAll(AuthContext.Mock, Logger.pretty)),
);

const memoMap = Effect.runSync(Layer.makeMemoMap);

// Merge tracing layer with routes - must use provideMerge so the tracer is available
// at the runtime level for Effect.fn spans to be exported
const AllRoutesWithTracing = AllRoutes.pipe(Layer.provideMerge(TracerLive));

const { handler, dispose } = HttpLayerRouter.toWebHandler(AllRoutesWithTracing, {
  memoMap,
});

// Export dispose for potential graceful shutdown handling
export { dispose };

// Revert to original pattern - the Context.empty() is needed for TanStack Start integration
export const effectHandler = ({ request }: { request: Request }) =>
  handler(request, Context.empty() as any);
